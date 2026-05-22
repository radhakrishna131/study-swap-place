
-- Enums
create type public.listing_category as enum (
  'books','notes','electronics','transport','hostel','sports','gaming','music','other'
);
create type public.listing_condition as enum ('new','like_new','good','fair','poor');
create type public.listing_status as enum ('available','reserved','sold');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  college text not null default '',
  department text default '',
  hostel text default '',
  phone text default '',
  avatar_url text default '',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, college)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'college', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  negotiable boolean not null default false,
  category public.listing_category not null,
  condition public.listing_condition not null,
  status public.listing_status not null default 'available',
  images text[] not null default '{}',
  college text not null default '',
  hostel text default '',
  pickup_location text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone"
  on public.listings for select using (true);

create policy "Authenticated users can create listings"
  on public.listings for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own listings"
  on public.listings for update using (auth.uid() = seller_id);

create policy "Sellers can delete own listings"
  on public.listings for delete using (auth.uid() = seller_id);

create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

create index listings_category_idx on public.listings(category);
create index listings_status_idx on public.listings(status);
create index listings_college_idx on public.listings(college);
create index listings_created_at_idx on public.listings(created_at desc);

-- Favorites
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Users can view own favorites"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Users can remove favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- Storage bucket for listing images
insert into storage.buckets (id, name, public)
  values ('listing-images','listing-images', true);

create policy "Listing images are publicly accessible"
  on storage.objects for select using (bucket_id = 'listing-images');

create policy "Authenticated users can upload listing images"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images' and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own listing images"
  on storage.objects for update using (
    bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own listing images"
  on storage.objects for delete using (
    bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
