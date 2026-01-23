-- Add display_name column to profiles for user identification
ALTER TABLE public.profiles 
ADD COLUMN display_name text;

-- Update the admin_users_view to include display_name
DROP VIEW IF EXISTS public.admin_users_view;

CREATE VIEW public.admin_users_view AS
SELECT 
  p.user_id,
  p.display_name,
  p.store_name,
  p.account_status as status,
  p.created_at,
  au.email
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.user_id;