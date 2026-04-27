-- Tabla para registrar nuevos usuarios con IP y enviar notificaciones
CREATE TABLE IF NOT EXISTS public.new_user_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_sent BOOLEAN DEFAULT false
);

ALTER TABLE public.new_user_registrations ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver los registros
CREATE POLICY "Admins can view new user registrations"
  ON public.new_user_registrations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Function para registrar nuevo usuario con datos de IP
CREATE OR REPLACE FUNCTION public.handle_new_user_with_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en profiles con trial activo
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
    'active',
    now() + interval '15 days',
    now()
  );

  -- Registrar en tabla de notificaciones (IP se actualizará desde el cliente)
  INSERT INTO public.new_user_registrations (
    user_id,
    email,
    user_agent
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'sub'  -- Provider ID como referencia
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recrear el trigger con la nueva función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_notification();

-- Function para actualizar IP desde el cliente
CREATE OR REPLACE FUNCTION public.update_registration_ip(
  p_ip_address TEXT,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_registration_id UUID;
  v_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Obtener el registro más reciente del usuario
  SELECT id INTO v_registration_id
  FROM public.new_user_registrations
  WHERE user_id = v_user_id
  ORDER BY registered_at DESC
  LIMIT 1;

  IF v_registration_id IS NOT NULL THEN
    UPDATE public.new_user_registrations
    SET 
      ip_address = p_ip_address,
      country = p_country,
      city = p_city,
      user_agent = COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown')
    WHERE id = v_registration_id;
  END IF;

  -- Contar registros de hoy para notificación
  SELECT COUNT(*) INTO v_count
  FROM public.new_user_registrations
  WHERE DATE(registered_at) = CURRENT_DATE;

  -- Aquí podrías integrar con un servicio de notificaciones
  -- Por ahora solo registramos que se actualizó
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permitir a usuarios autenticados actualizar su propia IP
CREATE POLICY "Users can update own registration IP"
  ON public.new_user_registrations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
