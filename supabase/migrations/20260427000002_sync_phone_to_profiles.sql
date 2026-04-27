
-- Update handle_new_user function to capture phone from metadata or auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    store_name, 
    display_name,
    logo_url,
    whatsapp_number
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'store_name', 'Mi Tienda'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill existing profiles with phone numbers from auth.users if they are missing
DO $$
BEGIN
  UPDATE public.profiles p
  SET whatsapp_number = COALESCE(u.raw_user_meta_data->>'phone', u.phone)
  FROM auth.users u
  WHERE p.user_id = u.id
    AND (p.whatsapp_number IS NULL OR p.whatsapp_number = '')
    AND (u.raw_user_meta_data->>'phone' IS NOT NULL OR u.phone IS NOT NULL);
END $$;
