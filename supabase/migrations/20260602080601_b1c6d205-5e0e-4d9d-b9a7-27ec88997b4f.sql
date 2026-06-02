-- 1. Profiles: restrict reads to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Notifications: only allow inserting notifications addressed to self
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;

CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Storage: drop broad SELECT on listing-images (public URLs still work for public bucket)
DROP POLICY IF EXISTS "Anyone can view a listing image by path" ON storage.objects;
