-- Brihta-MAT — ⚔️ Bitka: 2–8 prijateljev, 60 sekund, ista vprašanja, stopničke
--
-- KAKO DELUJE:
--   1. Otrok ustvari bitko in dobi 4-mestno kodo (kot PIN pri Kahootu).
--   2. Prijatelji vpišejo kodo in se pridružijo (največ 8 igralcev).
--   3. Gostitelj začne. Vsi dobijo odštevanje ob istem trenutku — po uri
--      strežnika, ne tablice, ker imajo šolske tablice pogosto napačno uro.
--   4. Vsi rešujejo ista vprašanja v istem vrstnem redu (skupni `seed`).
--   5. Vsaka naprava vsaki 2 s pošlje svoj rezultat in prebere ostale.
--   6. Po koncu stopničke; gostitelj lahko začne novo rundo z istimi igralci.
--
-- VARNOST: ključ v script.js je javen, zato do tabel ni neposrednega dostopa
-- (RLS vklopljen, brez pravil). Vse gre prek spodnjih funkcij. Vsak igralec
-- dobi skrivni žeton, ki ga pozna le njegova naprava — brez njega ne more
-- nihče spreminjati tujega rezultata ali začeti bitke namesto gostitelja.
--
-- Zaženi enkrat v Supabase → SQL Editor.

-- ── 1. Tabele ─────────────────────────────────────────────────────────────
create table if not exists battles (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[0-9]{4}$'),
  host_player uuid,
  status      text not null default 'lobby'
              check (status in ('lobby', 'running', 'finished')),
  seed        int  not null default 0,
  round       int  not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists battle_players (
  id        uuid primary key default gen_random_uuid(),
  battle_id uuid not null references battles(id) on delete cascade,
  token     uuid not null unique default gen_random_uuid(),
  name      text not null check (char_length(name) between 1 and 30),
  emoji     text not null default '🦉' check (char_length(emoji) <= 16),
  score     int  not null default 0,
  correct   int  not null default 0,
  wrong     int  not null default 0,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index if not exists battle_players_battle on battle_players(battle_id);
-- Dva otroka z istim imenom v isti bitki bi se na stopničkah ne ločila.
create unique index if not exists battle_players_name
  on battle_players(battle_id, lower(name));

alter table battles        enable row level security;
alter table battle_players enable row level security;

-- ── 2. Pomožne funkcije ───────────────────────────────────────────────────
-- Stanje bitke, kot ga vidi igralec p_me. Žetonov nikoli ne vrne.
-- Časi so v milisekundah, da jih JavaScript uporabi neposredno.
create or replace function public._battle_state(p_battle uuid, p_me uuid)
returns json
language sql security definer set search_path = public
as $$
  select json_build_object(
    'now',       (extract(epoch from clock_timestamp()) * 1000)::bigint,
    'code',      b.code,
    'status',    b.status,
    'seed',      b.seed,
    'round',     b.round,
    'starts_at', (extract(epoch from b.starts_at) * 1000)::bigint,
    'ends_at',   (extract(epoch from b.ends_at)   * 1000)::bigint,
    'host',      b.host_player,
    'me',        p_me,
    'players',   coalesce((
      select json_agg(json_build_object(
               'id', p.id, 'name', p.name, 'emoji', p.emoji,
               'score', p.score, 'correct', p.correct, 'wrong', p.wrong)
             order by p.score desc, p.correct desc, p.joined_at)
        from battle_players p where p.battle_id = b.id), '[]'::json))
  from battles b where b.id = p_battle;
$$;

-- V čakalnici odstrani igralce, ki so zaprli stran (20 s brez glasu), in
-- predaj vlogo gostitelja naslednjemu, če je odšel gostitelj. Med igro in
-- po njej nikogar ne briše — njegov rezultat sodi na stopničke.
create or replace function public._battle_tidy(p_battle uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from battle_players p
   using battles b
   where b.id = p_battle and p.battle_id = b.id
     and b.status = 'lobby'
     and p.last_seen < now() - interval '20 seconds';

  update battles b
     set host_player = (select p.id from battle_players p
                         where p.battle_id = b.id
                         order by p.joined_at limit 1)
   where b.id = p_battle
     and not exists (select 1 from battle_players p
                      where p.id = b.host_player and p.battle_id = b.id);

  -- 4 s po koncu se zaključi; do takrat še sprejema zadnje rezultate.
  update battles set status = 'finished'
   where id = p_battle and status = 'running'
     and now() > ends_at + interval '4 seconds';
end; $$;

-- ── 3. Ustvari bitko ──────────────────────────────────────────────────────
create or replace function public.create_battle(p_name text, p_emoji text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_code text; v_battle uuid; v_player uuid; v_token uuid; v_try int := 0;
begin
  p_name := trim(coalesce(p_name, ''));
  if char_length(p_name) not between 1 and 30 then
    return json_build_object('error', 'name');
  end if;

  -- Stare bitke se pobrišejo sproti, da tabela ne raste.
  delete from battles where created_at < now() - interval '12 hours';

  loop
    v_code := (1000 + floor(random() * 9000))::int::text;
    begin
      insert into battles (code, seed)
      values (v_code, floor(random() * 2000000000)::int)
      returning id into v_battle;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 40 then return json_build_object('error', 'busy'); end if;
    end;
  end loop;

  insert into battle_players (battle_id, name, emoji)
  values (v_battle, p_name, coalesce(nullif(left(p_emoji, 16), ''), '🦉'))
  returning id, token into v_player, v_token;
  update battles set host_player = v_player where id = v_battle;

  return json_build_object('token', v_token,
                           'state', _battle_state(v_battle, v_player));
end; $$;

-- ── 4. Pridruži se ────────────────────────────────────────────────────────
create or replace function public.join_battle(p_code text, p_name text, p_emoji text)
returns json
language plpgsql security definer set search_path = public
as $$
declare v_b battles; v_player uuid; v_token uuid;
begin
  p_name := trim(coalesce(p_name, ''));
  if char_length(p_name) not between 1 and 30 then
    return json_build_object('error', 'name');
  end if;

  select * into v_b from battles where code = trim(p_code);
  if not found then return json_build_object('error', 'not_found'); end if;

  perform _battle_tidy(v_b.id);
  select * into v_b from battles where id = v_b.id;
  if v_b.status <> 'lobby' then return json_build_object('error', 'started'); end if;
  if (select count(*) from battle_players where battle_id = v_b.id) >= 8 then
    return json_build_object('error', 'full');
  end if;

  begin
    insert into battle_players (battle_id, name, emoji)
    values (v_b.id, p_name, coalesce(nullif(left(p_emoji, 16), ''), '🦉'))
    returning id, token into v_player, v_token;
  exception when unique_violation then
    return json_build_object('error', 'name_taken');
  end;

  return json_build_object('token', v_token,
                           'state', _battle_state(v_b.id, v_player));
end; $$;

-- ── 5. Sinhronizacija (vsaki 2 s) ─────────────────────────────────────────
-- Označi igralca kot prisotnega, med igro sprejme njegov rezultat in vrne
-- stanje vseh. En klic za vse, da je prometa čim manj.
create or replace function public.battle_sync(
  p_code text, p_token uuid,
  p_round int default null, p_score int default null,
  p_correct int default null, p_wrong int default null)
returns json
language plpgsql security definer set search_path = public
as $$
declare v_b battles; v_p battle_players; v_elapsed numeric;
begin
  select p.* into v_p
    from battle_players p join battles b on b.id = p.battle_id
   where p.token = p_token and b.code = trim(p_code);
  if not found then return json_build_object('error', 'gone'); end if;

  update battle_players set last_seen = now() where id = v_p.id;
  perform _battle_tidy(v_p.battle_id);
  select * into v_b from battles where id = v_p.battle_id;

  -- Rezultat velja le za tekočo rundo in le do 4 s po koncu. Meje so
  -- široke za poštenega otroka, a ustavijo ročno poslane nesmisle:
  -- največ 3 točke na pravilen odgovor (največji množilnik) in največ
  -- 3 odgovori na sekundo.
  if p_score is not null and v_b.status = 'running'
     and p_round = v_b.round
     and now() between v_b.starts_at and v_b.ends_at + interval '4 seconds' then
    v_elapsed := extract(epoch from (least(now(), v_b.ends_at) - v_b.starts_at));
    p_correct := greatest(0, least(coalesce(p_correct, 0), ceil(v_elapsed * 3)::int + 3));
    p_wrong   := greatest(0, least(coalesce(p_wrong, 0), 200));
    p_score   := greatest(0, least(p_score, p_correct * 3, 300));
    -- greatest: zakasnel starejši klic ne sme znižati rezultata
    update battle_players
       set score   = greatest(score, p_score),
           correct = greatest(correct, p_correct),
           wrong   = greatest(wrong, p_wrong)
     where id = v_p.id;
  end if;

  return _battle_state(v_b.id, v_p.id);
end; $$;

-- ── 6. Začni (samo gostitelj) ─────────────────────────────────────────────
-- 5 s zamika: vsaka naprava vpraša strežnik vsaki 1,5 s, zato vse še
-- pravočasno vidijo začetek in pokažejo celotno odštevanje 3-2-1.
create or replace function public.start_battle(p_code text, p_token uuid)
returns json
language plpgsql security definer set search_path = public
as $$
declare v_b battles; v_me uuid; v_battle uuid;
begin
  select p.id, p.battle_id into v_me, v_battle
    from battles b join battle_players p on p.battle_id = b.id
   where b.code = trim(p_code) and p.token = p_token;
  if v_me is null then return json_build_object('error', 'gone'); end if;

  perform _battle_tidy(v_battle);
  select * into v_b from battles where id = v_battle;
  if v_b.host_player is distinct from v_me then
    return json_build_object('error', 'not_host');
  end if;
  if v_b.status <> 'lobby' then return json_build_object('error', 'started'); end if;
  if (select count(*) from battle_players where battle_id = v_b.id) < 2 then
    return json_build_object('error', 'alone');
  end if;

  update battle_players set score = 0, correct = 0, wrong = 0
   where battle_id = v_b.id;
  update battles
     set status = 'running', round = round + 1,
         seed = floor(random() * 2000000000)::int,
         starts_at = now() + interval '5 seconds',
         ends_at   = now() + interval '65 seconds'
   where id = v_b.id;

  return _battle_state(v_b.id, v_me);
end; $$;

-- ── 7. Še enkrat (samo gostitelj) ─────────────────────────────────────────
-- Nazaj v čakalnico z istimi igralci; kdor je medtem odšel, izpade po 20 s.
create or replace function public.rematch_battle(p_code text, p_token uuid)
returns json
language plpgsql security definer set search_path = public
as $$
declare v_b battles; v_me uuid; v_battle uuid;
begin
  select p.id, p.battle_id into v_me, v_battle
    from battles b join battle_players p on p.battle_id = b.id
   where b.code = trim(p_code) and p.token = p_token;
  if v_me is null then return json_build_object('error', 'gone'); end if;

  perform _battle_tidy(v_battle);
  select * into v_b from battles where id = v_battle;
  if v_b.host_player is distinct from v_me then
    return json_build_object('error', 'not_host');
  end if;

  if v_b.status = 'finished' then
    -- last_seen se osveži vsem: na stopničkah so nekateri morda čakali
    -- dlje od 20 s in bi jih čakalnica sicer takoj izločila.
    update battle_players set score = 0, correct = 0, wrong = 0, last_seen = now()
     where battle_id = v_b.id;
    update battles set status = 'lobby', starts_at = null, ends_at = null
     where id = v_b.id;
  end if;

  return _battle_state(v_b.id, v_me);
end; $$;

-- ── 8. Zapusti ────────────────────────────────────────────────────────────
-- V čakalnici igralca odstrani takoj. Med igro in po njej ostane na
-- stopničkah — rezultat je dosegel.
create or replace function public.leave_battle(p_code text, p_token uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_battle uuid;
begin
  select b.id into v_battle
    from battles b join battle_players p on p.battle_id = b.id
   where b.code = trim(p_code) and p.token = p_token;
  if v_battle is null then return; end if;

  delete from battle_players p using battles b
   where p.token = p_token and b.id = p.battle_id and b.status <> 'running';
  if not exists (select 1 from battle_players where battle_id = v_battle) then
    delete from battles where id = v_battle;
  else
    perform _battle_tidy(v_battle);
  end if;
end; $$;

-- ── 9. Pravice ────────────────────────────────────────────────────────────
-- Pomožni funkciji nista za neposredne klice iz aplikacije.
revoke execute on function public._battle_state(uuid, uuid) from public, anon, authenticated;
revoke execute on function public._battle_tidy(uuid)        from public, anon, authenticated;

-- ── Hitri test ────────────────────────────────────────────────────────────
-- select public.create_battle('TEST', '🦉');
-- select code, status, round from battles order by created_at desc limit 5;
-- delete from battles where code = 'XXXX';   -- pospravi za sabo
