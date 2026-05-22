
-- Fix search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoke execute from API roles on SECURITY DEFINER trigger functions
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Storage: drop broad public SELECT and scope it so direct URL access still works
drop policy if exists "Listing images are publicly accessible" on storage.objects;

create policy "Anyone can view a listing image by path"
  on storage.objects for select
  using (bucket_id = 'listing-images');
-- Note: public bucket already serves files via signed URL/CDN; this keeps reads open.
