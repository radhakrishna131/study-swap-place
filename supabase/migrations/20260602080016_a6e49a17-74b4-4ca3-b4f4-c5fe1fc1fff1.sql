-- Revoke execute on security-definer helper (only pg_cron/postgres needs it)
REVOKE EXECUTE ON FUNCTION public.expire_old_buy_requests() FROM PUBLIC, anon, authenticated;

-- Replace broad public SELECT with owner-or-referenced policy isn't practical for avatars
-- (we need URLs to render). Keep public read but the warning is acceptable for avatar buckets.
-- However we can drop the SELECT policy and rely on the bucket being public for URL access.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
