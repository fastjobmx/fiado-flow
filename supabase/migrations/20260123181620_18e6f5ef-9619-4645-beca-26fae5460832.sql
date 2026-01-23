-- Fix security issues: Drop the insecure view that exposes auth.users
DROP VIEW IF EXISTS public.admin_users_view;

-- Create a secure function to get user email for admins only
CREATE OR REPLACE FUNCTION public.get_user_email_for_admin(target_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT email FROM auth.users WHERE id = target_user_id)::text
    ELSE NULL
  END;
$$;