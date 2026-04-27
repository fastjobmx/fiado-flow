-- Actualizar handle_new_user para asignar plan gratuito de 15 días a nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    store_name, 
    display_name,
    logo_url,
    account_status,
    next_maintenance_due_at,
    last_maintenance_paid_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'store_name', 'Mi Tienda'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'active',  -- Activar cuenta inmediatamente
    now() + interval '15 days',  -- Prueba gratuita de 15 días
    now()  -- Marcar como pagado hoy (inicio del trial)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
