-- Shared Oli leaderboard. The table itself is never exposed to browser roles;
-- clients can only use the three narrowly-scoped RPC functions below.
create table if not exists public.oli_leaderboard (
  id bigint generated always as identity primary key,
  display_name text not null,
  normalized_name text not null unique,
  device_hash text not null,
  score integer not null default 0 check (score >= 0),
  combo integer not null default 0 check (combo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.oli_leaderboard enable row level security;
revoke all on table public.oli_leaderboard from public, anon, authenticated;
revoke all on sequence public.oli_leaderboard_id_seq from public, anon, authenticated;

create or replace function public.claim_oli_player(p_name text, p_device_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  clean_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  name_key text;
  owner_hash text;
begin
  if char_length(clean_name) < 1 or char_length(clean_name) > 12 then
    raise exception 'invalid_name';
  end if;
  if p_device_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_device';
  end if;

  name_key := lower(clean_name);
  perform pg_advisory_xact_lock(hashtextextended(name_key, 0));

  select device_hash into owner_hash
  from public.oli_leaderboard
  where normalized_name = name_key;

  if not found then
    insert into public.oli_leaderboard (display_name, normalized_name, device_hash)
    values (clean_name, name_key, p_device_hash);
    return true;
  end if;

  return owner_hash = p_device_hash;
end;
$$;

create or replace function public.submit_oli_score(
  p_name text,
  p_device_hash text,
  p_score integer,
  p_combo integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  clean_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  name_key text;
  owner_hash text;
begin
  if char_length(clean_name) < 1 or char_length(clean_name) > 12 then
    raise exception 'invalid_name';
  end if;
  if p_device_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_device';
  end if;

  name_key := lower(clean_name);
  perform pg_advisory_xact_lock(hashtextextended(name_key, 0));

  select device_hash into owner_hash
  from public.oli_leaderboard
  where normalized_name = name_key
  for update;

  if not found then
    insert into public.oli_leaderboard (display_name, normalized_name, device_hash, score, combo)
    values (clean_name, name_key, p_device_hash, greatest(coalesce(p_score, 0), 0), greatest(coalesce(p_combo, 0), 0));
    return true;
  end if;

  if owner_hash <> p_device_hash then return false; end if;

  update public.oli_leaderboard
  set display_name = clean_name,
      score = greatest(score, greatest(coalesce(p_score, 0), 0)),
      combo = case when coalesce(p_score, 0) >= score then greatest(combo, greatest(coalesce(p_combo, 0), 0)) else combo end,
      updated_at = now()
  where normalized_name = name_key;

  return true;
end;
$$;

create or replace function public.get_oli_leaderboard(p_limit integer default 10)
returns table(name text, score integer, combo integer, rank bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select display_name, board.score, board.combo,
         row_number() over (order by board.score desc, board.updated_at asc) as rank
  from public.oli_leaderboard as board
  order by board.score desc, board.updated_at asc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

revoke all on function public.claim_oli_player(text, text) from public;
revoke all on function public.submit_oli_score(text, text, integer, integer) from public;
revoke all on function public.get_oli_leaderboard(integer) from public;
revoke all on function public.claim_oli_player(text, text) from authenticated;
revoke all on function public.submit_oli_score(text, text, integer, integer) from authenticated;
revoke all on function public.get_oli_leaderboard(integer) from authenticated;
grant execute on function public.claim_oli_player(text, text) to anon;
grant execute on function public.submit_oli_score(text, text, integer, integer) to anon;
grant execute on function public.get_oli_leaderboard(integer) to anon;

notify pgrst, 'reload schema';
