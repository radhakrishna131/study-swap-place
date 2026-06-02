-- 1. Add 'expired' to buy_request_status enum
ALTER TYPE public.buy_request_status ADD VALUE IF NOT EXISTS 'expired';

-- 2. Function to expire old buy requests
CREATE OR REPLACE FUNCTION public.expire_old_buy_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.buy_requests
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending'
    AND created_at < now() - interval '7 days';

  UPDATE public.buy_requests
  SET status = 'expired', updated_at = now()
  WHERE status = 'accepted'
    AND pickup_date::timestamp < (now() - interval '2 days');
END;
$$;

-- 3. Schedule via pg_cron - run hourly
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('expire-old-buy-requests');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-old-buy-requests',
  '0 * * * *',
  $$ SELECT public.expire_old_buy_requests(); $$
);

-- 4. Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
