-- Fix run_maintenance_billing to handle $0 invoices correctly
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

  -- 4.1) Ensure an invoice exists for ACTIVE accounts
  -- If price is 0, we can mark it as paid or open, but let's keep it open and fix the overdue logic
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

  -- 4.2) Mark overdue ONLY IF amount > 0
  UPDATE public.maintenance_invoices i
  SET status = 'overdue'
  WHERE i.period_ym = period
    AND i.status = 'open'
    AND i.amount_cop > 0
    AND now_ts > i.due_at;

  -- 4.3) Inactivate if still unpaid after grace ONLY IF amount > 0
  UPDATE public.profiles p
  SET account_status = 'inactive'
  WHERE p.account_status <> 'inactive'
    AND EXISTS (
      SELECT 1
      FROM public.maintenance_invoices i
      WHERE i.user_id = p.user_id
        AND i.period_ym = period
        AND i.paid_at IS NULL
        AND i.amount_cop > 0
        AND now_ts > i.grace_until
    );

  -- 4.4) Mark invoice as inactive for those accounts ONLY IF amount > 0
  UPDATE public.maintenance_invoices i
  SET status = 'inactive'
  WHERE i.period_ym = period
    AND i.paid_at IS NULL
    AND i.amount_cop > 0
    AND now_ts > i.grace_until;
END;
$$;
