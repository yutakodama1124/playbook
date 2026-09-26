create table units (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course text not null,
  test_date date,
  status text not null default 'queued' check (status in ('queued','running','ready','failed')),
  error text,
  concept_map jsonb,
  input jsonb not null,
  created_at timestamptz not null default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  mode text not null,
  status text not null default 'queued' check (status in ('queued','running','ready','failed')),
  error text,
  spec jsonb,
  assets jsonb not null default '{}'::jsonb,
  verifier_report jsonb,
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  kind text not null check (kind in ('scene','portrait','prop','card','boss')),
  tags text[] not null,
  mood text,
  positions jsonb not null default '{}'::jsonb,
  style_version int not null default 1,
  created_at timestamptz not null default now()
);
create index assets_tags_idx on assets using gin (tags);

-- All access goes through server routes using the service-role key; lock tables to anon.
alter table units enable row level security;
alter table games enable row level security;
alter table assets enable row level security;

insert into storage.buckets (id, name, public) values ('assets', 'assets', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false) on conflict do nothing;
