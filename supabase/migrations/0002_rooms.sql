create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  game_id uuid not null references games(id) on delete cascade,
  host_token text not null,
  state jsonb not null,
  created_at timestamptz not null default now()
);

create table room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  token text not null,
  score int not null default 0,
  joined_at timestamptz not null default now()
);
create index room_players_room_idx on room_players(room_id);

create table room_votes (
  room_id uuid not null references rooms(id) on delete cascade,
  round int not null,
  voter_id uuid not null references room_players(id) on delete cascade,
  target_id uuid not null references room_players(id) on delete cascade,
  primary key (room_id, round, voter_id)
);

alter table rooms enable row level security;
alter table room_players enable row level security;
alter table room_votes enable row level security;
