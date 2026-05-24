-- Status enum
create type public.buy_request_status as enum ('pending','accepted','rejected','completed');

create table public.buy_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null,
  seller_id uuid not null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text,
  pickup_address text not null,
  pickup_date date not null,
  pickup_time text not null,
  message text,
  status public.buy_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index buy_requests_seller_idx on public.buy_requests(seller_id, created_at desc);
create index buy_requests_buyer_idx on public.buy_requests(buyer_id, created_at desc);
create index buy_requests_listing_idx on public.buy_requests(listing_id);

alter table public.buy_requests enable row level security;

create policy "Buyers create requests" on public.buy_requests
  for insert with check (auth.uid() = buyer_id);

create policy "Buyer or seller can view" on public.buy_requests
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Seller can update status" on public.buy_requests
  for update using (auth.uid() = seller_id);

create trigger buy_requests_updated_at
  before update on public.buy_requests
  for each row execute function public.set_updated_at();

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Authenticated insert notifications" on public.notifications
  for insert with check (auth.uid() is not null);
