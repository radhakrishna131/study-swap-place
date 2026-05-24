ALTER TABLE public.listings DROP CONSTRAINT listings_seller_id_fkey;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';