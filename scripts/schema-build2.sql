-- Australian Payroll Association CRM — Build 2 schema
-- Adds activity_log (audit of contact status changes) and orders.
-- Idempotent: safe to run more than once.

-- ---- activity_log ---------------------------------------------------
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid references public.contacts(id) on delete cascade,
  person_id   uuid references public.people(id)   on delete cascade,
  from_status contact_status,
  to_status   contact_status,
  actor       text,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_contact_idx on public.activity_log (contact_id);
create index if not exists activity_log_person_idx  on public.activity_log (person_id);
create index if not exists activity_log_created_idx on public.activity_log (created_at desc);

-- ---- Orders ---------------------------------------------------------
do $$ begin
  create type order_status as enum ('pending','paid','refunded','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.people(id) on delete cascade,
  product_name text not null,
  amount_cents integer not null default 0,
  currency     text not null default 'AUD',
  status       order_status not null default 'pending',
  created_at   timestamptz not null default now()
);

create index if not exists orders_person_idx  on public.orders (person_id);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ---- RLS ------------------------------------------------------------
-- Server-only access via the service role key (bypasses RLS). No
-- anon/authenticated policies, so unreachable from the browser.
alter table public.activity_log enable row level security;
alter table public.orders       enable row level security;
