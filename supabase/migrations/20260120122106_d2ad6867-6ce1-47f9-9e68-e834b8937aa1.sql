-- Add active theme column to profiles
ALTER TABLE public.profiles
ADD COLUMN active_theme TEXT DEFAULT 'light';