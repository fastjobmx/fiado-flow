-- 1) Roles (separados de profiles)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'store_owner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER role checker (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Allow users to read their own roles; admins can read all.
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can manage roles.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- 2) Estado de cuenta del tendero y cobro mensual
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('pending', 'active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS maintenance_monthly_price_cop numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_maintenance_paid_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS next_maintenance_due_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles (account_status);

-- Invoice table (una por mes por tendero)
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('open', 'paid', 'overdue', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.maintenance_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_ym text NOT NULL, -- e.g. '2026-01'
  amount_cop numeric NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'open',
  due_at timestamptz NOT NULL,
  grace_until timestamptz NOT NULL,
  paid_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_ym)
);

ALTER TABLE public.maintenance_invoices ENABLE ROW LEVEL SECURITY;

-- Timestamp trigger for invoices
DROP TRIGGER IF EXISTS update_maintenance_invoices_updated_at ON public.maintenance_invoices;
CREATE TRIGGER update_maintenance_invoices_updated_at
BEFORE UPDATE ON public.maintenance_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Policies: owners see their own invoices; admins see all.
DROP POLICY IF EXISTS "Owners can view own invoices" ON public.maintenance_invoices;
CREATE POLICY "Owners can view own invoices"
ON public.maintenance_invoices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can create/mark paid (registro manual).
DROP POLICY IF EXISTS "Admins can insert invoices" ON public.maintenance_invoices;
CREATE POLICY "Admins can insert invoices"
ON public.maintenance_invoices
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update invoices" ON public.maintenance_invoices;
CREATE POLICY "Admins can update invoices"
ON public.maintenance_invoices
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- 3) Admin visibility on existing tables (SELECT only)
-- profiles: keep existing self-access, add admin select.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- customers/transactions: allow admins to SELECT everything for stats/audits
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Admins can view all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = owner_id);


-- 4) Job function: crear factura del mes, marcar vencidos, inactivar tras 7 días
CREATE OR REPLACE FUNCTION public.run_maintenance_billing(now_ts timestamptz DEFAULT now())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period text;
  first_day timestamptz;
  due_at timestamptz;
  grace_until timestamptz;
BEGIN
  period := to_char(now_ts, 'YYYY-MM');
  first_day := date_trunc('month', now_ts);
  -- due: día 1 del mes 00:00; grace: +7 días
  due_at := first_day;
  grace_until := first_day + interval '7 days';

  -- 4.1) Ensure an invoice exists for ACTIVE accounts (and pending too, optional)
  INSERT INTO public.maintenance_invoices (user_id, period_ym, amount_cop, status, due_at, grace_until)
  SELECT p.user_id,
         period,
         COALESCE(p.maintenance_monthly_price_cop, 0),
         'open',
         due_at,
         grace_until
  FROM public.profiles p
  WHERE p.account_status IN ('active','pending')
    AND NOT EXISTS (
      SELECT 1
      FROM public.maintenance_invoices i
      WHERE i.user_id = p.user_id
        AND i.period_ym = period
    );

  -- 4.2) Mark overdue
  UPDATE public.maintenance_invoices i
  SET status = 'overdue'
  WHERE i.period_ym = period
    AND i.status = 'open'
    AND now_ts > i.due_at;

  -- 4.3) Inactivate if still unpaid after grace
  UPDATE public.profiles p
  SET account_status = 'inactive'
  WHERE p.account_status <> 'inactive'
    AND EXISTS (
      SELECT 1
      FROM public.maintenance_invoices i
      WHERE i.user_id = p.user_id
        AND i.period_ym = period
        AND i.paid_at IS NULL
        AND now_ts > i.grace_until
    );

  -- 4.4) Mark invoice as inactive for those accounts
  UPDATE public.maintenance_invoices i
  SET status = 'inactive'
  WHERE i.period_ym = period
    AND i.paid_at IS NULL
    AND now_ts > i.grace_until;
END;
$$;