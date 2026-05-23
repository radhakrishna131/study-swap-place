ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram text DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_contact text NOT NULL DEFAULT 'phone';