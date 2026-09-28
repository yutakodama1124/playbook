create table mastery_events (
  id bigint generated always as identity primary key,
  device_id text not null,
  unit_id uuid not null references units(id) on delete cascade,
  game_id uuid references games(id) on delete set null,
  concept_ids text[] not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index mastery_events_lookup_idx on mastery_events(device_id, unit_id);
alter table mastery_events enable row level security;
