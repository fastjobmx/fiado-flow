-- Agregar campos de contacto y plantillas al perfil del tendero
alter table public.profiles
  add column if not exists whatsapp_number text null,
  add column if not exists nequi_number text null,
  add column if not exists daviplata_number text null,
  add column if not exists payment_accounts jsonb null default '[]'::jsonb,
  add column if not exists message_template_reminder text null,
  add column if not exists message_template_receipt text null;