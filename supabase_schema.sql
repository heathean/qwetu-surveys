create table listings (
  id uuid primary key default gen_random_uuid(),
  building_name text not null,
  location text not null,
  room_label text not null,
  price numeric not null,
  description text,
  landlord_name text not null,
  landlord_phone text not null,
  status text not null default 'vacant',
  hunter_name text,
  hunter_phone text,
  created_at timestamptz not null default now()
);

alter table listings enable row level security;

create policy "Anyone can read listings"
  on listings for select
  using (true);

create policy "Anyone can post a listing"
  on listings for insert
  with check (true);

create policy "Anyone can update a listing"
  on listings for update
  using (true);

create policy "Anyone can delete a listing"
  on listings for delete
  using (true);

alter publication supabase_realtime add table listings;
