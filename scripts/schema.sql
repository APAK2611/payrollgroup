-- Australian Payroll Association CRM — Build 1 schema
-- People (contact directory) + Contacts (inquiry pipeline).
-- Idempotent: safe to run more than once.

create extension if not exists "pgcrypto";

-- ---- People ---------------------------------------------------------
create table if not exists public.people (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text,
  phone         text,
  company       text,
  role          text,
  source_site   text,
  ok_to_contact boolean not null default false,
  attributes    jsonb   not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---- Enums ----------------------------------------------------------
do $$ begin
  create type contact_type as enum
    ('membership','training','consulting','general_enquiry','newsletter_signup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_status as enum
    ('new_lead','contacted','discovery_call','proposal','won','lost');
exception when duplicate_object then null; end $$;

-- ---- Contacts (inquiries) ------------------------------------------
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references public.people(id) on delete cascade,
  type       contact_type not null,
  subject    text,
  message    text,
  source     text,
  status     contact_status not null default 'new_lead',
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists contacts_created_at_idx on public.contacts (created_at desc);
create index if not exists contacts_person_id_idx  on public.contacts (person_id);
create index if not exists people_email_idx         on public.people (email);

-- ---- Row Level Security --------------------------------------------
-- Lock both tables down. All app access is server-side with the
-- service role key, which bypasses RLS. No anon/authenticated policies
-- are defined, so the tables are unreachable from the browser.
alter table public.people   enable row level security;
alter table public.contacts enable row level security;
