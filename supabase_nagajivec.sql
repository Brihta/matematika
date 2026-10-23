-- Brihta-MAT — 👾 Nagajivec: ljubljenčki skupaj proti nagajivcu (Do 20)
--
-- KAKO DELUJE (po zgledu Bitke, supabase_bitka.sql):
--   1. Prijavljen učenec z ljubljenčkom ustvari boj in dobi 4-mestno kodo.
--      Prijatelji se pridružijo (1–8 igralcev, igra se lahko tudi sam).
--   2. V čakalnici vsak glasuje za nagajivca (Kujavka, Bahač, Sluzko) in
--      vidi svojo raven računov. Raven določi baza iz mejnikov: prva
--      skupina, ki je še ne obvlada (+ in −). Lažjo lahko izbere, težje ne.
--   3. Gostitelj začne: zmaga nagajivec z največ glasovi (izenačeno =
--      žreb). Nagajivec ima toliko zdravja, kolikor je vsota ciljev igralcev
--      (boss_config: do 10 = 8, brez prehoda = 7, s prehodom = 6). Zato
--      imata 2 ali 8 igralcev enake možnosti in nihče ne pridobi z lažjimi
--      računi. Ekipa ima 3 srčke na igralca.
--   4. 60 sekund: vsak pravilen odgovor je strel ljubljenčka, vsak napačen
--      vzame en srček (ljubljenček je za hip omotičen — to riše aplikacija).
--      Zmaga: zdravje nagajivca pade na 0. Poraz: zmanjka srčkov ali pa
--      nagajivec po 60 s pride do ljubljenčkov.
--   5. Zmaga prinese vsakemu igralcu +3 priboljške (boss_wins, štejejo v
--      dnevno mejo 20). Cekinov ni — Do 20 nikoli ne hrani cekinov.
--
-- VARNOST: kot pri Bitki vse gre prek funkcij (RLS brez pravil). Igralec
-- je prijavljen učenec; njegova naprava dobi skrivni žeton.
--
-- Zahteva supabase_ljubljencek.sql (ljubljenčki, mejniki, boss_wins).
-- Zaženi v Supabase → SQL Editor (celo datoteko; lahko večkrat).
--
-- STIKALO: ob zagonu je nagajivec ZAPRT — vidijo ga samo preizkuševalci
-- ljubljenčka (pet_testers: nik7a, lar4). Odpri za vse:
--   update boss_config set open = true;
--
-- NASTAVITVE (brez nove različice aplikacije):
--   update boss_config set target_d10 = 7;     -- manj zdravja na igralca
--   update boss_config set hearts = 4;         -- več srčkov na igralca

-- ── 1. Tabele ─────────────────────────────────────────────────────────────
create table if not exists boss_config (
  id         int primary key default 1 check (id = 1),
  target_d10 int not null default 8 check (target_d10 between 1 and 60),
  target_b20 int not null default 7 check (target_b20 between 1 and 60),
  target_pr  int not null default 6 check (target_pr  between 1 and 60),
  hearts     int not null default 3 check (hearts between 1 and 20)
);
insert into boss_config (id) values (1) on conflict (id) do nothing;
alter table boss_config enable row level security;
alter table boss_config add column if not exists open boolean not null default false;

create table if not exists boss_games (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[0-9]{4}$'),
  host_player uuid,
  status      text not null default 'lobby' check (status in ('lobby', 'running', 'finished')),
  round       int  not null default 0,
  boss        text,
  hp          int  not null default 0,
  hearts      int  not null default 0,
  result      text check (result in ('win', 'lose')),
  starts_at   timestamptz,
  ends_at     timestamptz,
  finished_at timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists boss_players (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references boss_games(id) on delete cascade,
  token      uuid not null unique default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  name       text not null,
  pet        json,
  levels     text[] not null default array['d10'],
  level      text not null default 'd10' check (level in ('d10', 'b20', 'pr')),
  vote       text check (vote in ('kujavka', 'bahac', 'sluzko')),
  correct    int  not null default 0,
  wrong      int  not null default 0,
  joined_at  timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  unique (game_id, student_id)
);
create index if not exists boss_players_game on boss_players(game_id);

alter table boss_games   enable row level security;
alter table boss_players enable row level security;

-- ── 2. Pomožne funkcije ───────────────────────────────────────────────────
-- Cilj (zdravje nagajivca) za igralca na tej ravni.
create or replace function public._boss_target(p_level text)
returns int language sql stable security definer set search_path = public as $$
  select case p_level when 'b20' then target_b20 when 'pr' then target_pr else target_d10 end
    from boss_config where id = 1;
$$;

-- Ravni, ki jih učenec sme izbrati: do prve skupine, ki je še ne obvlada
-- (oba mejnika, + in −). Zadnja v seznamu je privzeta.
create or replace function public._boss_levels(p_student uuid)
returns text[] language plpgsql stable security definer set search_path = public as $$
declare s seasons; v_out text[] := array['d10']; g text;
begin
  s := _album_season_for(p_student);
  if s.id is null then return v_out; end if;
  foreach g in array array['d10', 'b20'] loop
    exit when not (_pet_mastered(p_student, g, 'p', s.starts, _album_today())
               and _pet_mastered(p_student, g, 'm', s.starts, _album_today()));
    v_out := v_out || (case g when 'd10' then 'b20' else 'pr' end);
  end loop;
  return v_out;
end; $$;

-- Ljubljenček učenca v tekoči sezoni (za risbo pri vseh igralcih) ali null.
create or replace function public._boss_pet(p_student uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare s seasons;
begin
  if not _pet_visible(p_student) then return null; end if;
  s := _album_season_for(p_student);
  if s.id is null then return null; end if;
  return _pet_json(p_student, s.id);
end; $$;

-- Stanje boja, kot ga vidi igralec p_me. Žetonov in id-jev učencev ne vrne.
create or replace function public._boss_state(p_game uuid, p_me uuid)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'now',       (extract(epoch from clock_timestamp()) * 1000)::bigint,
    'code',      g.code,
    'status',    g.status,
    'round',     g.round,
    'boss',      g.boss,
    'hp',        g.hp,
    'hearts',    g.hearts,
    'result',    g.result,
    'starts_at', (extract(epoch from g.starts_at) * 1000)::bigint,
    'ends_at',   (extract(epoch from g.ends_at)   * 1000)::bigint,
    'host',      g.host_player,
    'me',        p_me,
    'players',   coalesce((
      select json_agg(json_build_object(
               'id', p.id, 'name', p.name, 'pet', p.pet, 'level', p.level, 'vote', p.vote,
               'levels', case when p.id = p_me then to_json(p.levels) end,
               'target', _boss_target(p.level),
               'correct', p.correct, 'wrong', p.wrong)
             order by p.joined_at)
        from boss_players p where p.game_id = g.id), '[]'::json))
  from boss_games g where g.id = p_game;
$$;

-- Konec boja: zmaga, ko je pravilnih toliko kot zdravja; poraz, ko
-- zmanjka srčkov ali 3 s po izteku časa (do takrat še sprejema zadnje
-- rezultate). Ob zmagi zapiše boss_wins (priboljški).
create or replace function public._boss_finish(p_game uuid)
returns void language plpgsql security definer set search_path = public as $$
declare g boss_games; v_c int; v_w int; v_res text;
begin
  select * into g from boss_games where id = p_game for update;
  if g.status <> 'running' or now() < g.starts_at then return; end if;
  select coalesce(sum(correct), 0), coalesce(sum(wrong), 0) into v_c, v_w
    from boss_players where game_id = p_game;
  v_res := case when v_c >= g.hp then 'win'
                when v_w >= g.hearts then 'lose'
                when now() > g.ends_at + interval '3 seconds' then 'lose' end;
  if v_res is null then return; end if;
  update boss_games set status = 'finished', result = v_res, finished_at = now() where id = p_game;
  if v_res = 'win' then
    insert into boss_wins (student_id, day, game_id, round)
    select student_id, _album_today(), p_game, g.round from boss_players where game_id = p_game
    on conflict do nothing;
  end if;
end; $$;

-- V čakalnici odstrani odsotne (20 s), preda vlogo gostitelja, med bojem
-- preveri konec.
create or replace function public._boss_tidy(p_game uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from boss_players p using boss_games g
   where g.id = p_game and p.game_id = g.id and g.status = 'lobby'
     and p.last_seen < now() - interval '20 seconds';
  update boss_games g
     set host_player = (select p.id from boss_players p where p.game_id = g.id order by p.joined_at limit 1)
   where g.id = p_game
     and not exists (select 1 from boss_players p where p.id = g.host_player and p.game_id = g.id);
  perform _boss_finish(p_game);
end; $$;

-- Ali nagajivca učenec sploh vidi (stikalo ali preizkuševalec).
create or replace function public.boss_access(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from students where id = p_student)
     and (coalesce((select open from boss_config where id = 1), false)
          or exists (select 1 from pet_testers where student_id = p_student));
$$;

-- Ali učenec sme v boj (odprto zanj, ljubljenček mora obstajati).
create or replace function public._boss_check(p_student uuid)
returns text language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from students where id = p_student) then return 'login'; end if;
  if not boss_access(p_student) then return 'closed'; end if;
  if _boss_pet(p_student) is null then return 'no_pet'; end if;
  return null;
end; $$;

-- Nov igralec v boju (za create in join).
create or replace function public._boss_add(p_game uuid, p_student uuid)
returns boss_players language plpgsql security definer set search_path = public as $$
declare v boss_players; v_lv text[];
begin
  v_lv := _boss_levels(p_student);
  insert into boss_players (game_id, student_id, name, pet, levels, level)
  values (p_game, p_student, (select username from students where id = p_student),
          _boss_pet(p_student), v_lv, v_lv[array_length(v_lv, 1)])
  returning * into v;
  return v;
end; $$;

-- ── 3. Ustvari, pridruži se ───────────────────────────────────────────────
create or replace function public.boss_create(p_student uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_err text; v_code text; v_game uuid; v boss_players; v_try int := 0;
begin
  v_err := _boss_check(p_student);
  if v_err is not null then return json_build_object('error', v_err); end if;
  delete from boss_games where created_at < now() - interval '12 hours';
  loop
    v_code := (1000 + floor(random() * 9000))::int::text;
    begin
      insert into boss_games (code) values (v_code) returning id into v_game;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 40 then return json_build_object('error', 'busy'); end if;
    end;
  end loop;
  v := _boss_add(v_game, p_student);
  update boss_games set host_player = v.id where id = v_game;
  return json_build_object('token', v.token, 'state', _boss_state(v_game, v.id));
end; $$;

create or replace function public.boss_join(p_code text, p_student uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_err text; g boss_games; v boss_players;
begin
  v_err := _boss_check(p_student);
  if v_err is not null then return json_build_object('error', v_err); end if;
  select * into g from boss_games where code = trim(p_code);
  if not found then return json_build_object('error', 'not_found'); end if;
  perform _boss_tidy(g.id);
  -- že v tem boju (druga naprava ali osvežena stran): isti igralec
  select * into v from boss_players where game_id = g.id and student_id = p_student;
  if found then
    update boss_players set last_seen = now() where id = v.id;
    return json_build_object('token', v.token, 'state', _boss_state(g.id, v.id));
  end if;
  select * into g from boss_games where id = g.id;
  if g.status <> 'lobby' then return json_build_object('error', 'started'); end if;
  if (select count(*) from boss_players where game_id = g.id) >= 8 then
    return json_build_object('error', 'full');
  end if;
  v := _boss_add(g.id, p_student);
  return json_build_object('token', v.token, 'state', _boss_state(g.id, v.id));
end; $$;

-- ── 4. Glas in raven (v čakalnici) ────────────────────────────────────────
create or replace function public.boss_choose(p_code text, p_token uuid, p_vote text, p_level text)
returns json language plpgsql security definer set search_path = public as $$
declare v boss_players;
begin
  select p.* into v from boss_players p join boss_games g on g.id = p.game_id
   where p.token = p_token and g.code = trim(p_code) and g.status = 'lobby';
  if not found then return json_build_object('error', 'gone'); end if;
  update boss_players
     set vote  = case when p_vote in ('kujavka', 'bahac', 'sluzko') then p_vote else vote end,
         level = case when p_level = any(levels) then p_level else level end,
         last_seen = now()
   where id = v.id;
  return _boss_state(v.game_id, v.id);
end; $$;

-- ── 5. Sinhronizacija (vsaki 2 s) ─────────────────────────────────────────
create or replace function public.boss_sync(
  p_code text, p_token uuid,
  p_round int default null, p_correct int default null, p_wrong int default null)
returns json language plpgsql security definer set search_path = public as $$
declare v boss_players; g boss_games; v_el numeric;
begin
  select p.* into v from boss_players p join boss_games b on b.id = p.game_id
   where p.token = p_token and b.code = trim(p_code);
  if not found then return json_build_object('error', 'gone'); end if;
  update boss_players set last_seen = now() where id = v.id;
  select * into g from boss_games where id = v.game_id;

  -- Rezultat velja za tekočo rundo do 3 s po koncu. Meje ustavijo ročno
  -- poslane nesmisle: največ 1,5 pravilnega in 1 napačen na sekundo.
  if p_correct is not null and g.status = 'running' and p_round = g.round
     and now() between g.starts_at and g.ends_at + interval '3 seconds' then
    v_el := extract(epoch from (least(now(), g.ends_at) - g.starts_at));
    update boss_players
       set correct = greatest(correct, least(greatest(p_correct, 0), ceil(v_el * 1.5)::int + 2)),
           wrong   = greatest(wrong,   least(greatest(coalesce(p_wrong, 0), 0), ceil(v_el)::int + 2))
     where id = v.id;
  end if;
  perform _boss_tidy(g.id);
  return _boss_state(g.id, v.id);
end; $$;

-- ── 6. Začni (gostitelj) ──────────────────────────────────────────────────
-- Nagajivec z največ glasovi (izenačeno ali brez glasov = žreb). 5 s
-- zamika za odštevanje, kot pri Bitki.
create or replace function public.boss_start(p_code text, p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare g boss_games; v_me uuid; v_game uuid; v_boss text; v_n int;
begin
  select p.id, p.game_id into v_me, v_game
    from boss_players p join boss_games b on b.id = p.game_id
   where p.token = p_token and b.code = trim(p_code);
  if v_me is null then return json_build_object('error', 'gone'); end if;
  perform _boss_tidy(v_game);
  select * into g from boss_games where id = v_game;
  if g.host_player is distinct from v_me then return json_build_object('error', 'not_host'); end if;
  if g.status <> 'lobby' then return json_build_object('error', 'started'); end if;

  select b into v_boss from (
    select b, count(p.vote) n
      from unnest(array['kujavka', 'bahac', 'sluzko']) b
      left join boss_players p on p.game_id = g.id and p.vote = b
     group by b) t
   order by n desc, random() limit 1;
  select count(*) into v_n from boss_players where game_id = g.id;

  update boss_players set correct = 0, wrong = 0 where game_id = g.id;
  update boss_games
     set status = 'running', round = round + 1, boss = v_boss, result = null, finished_at = null,
         hp = (select sum(_boss_target(level)) from boss_players where game_id = g.id),
         hearts = v_n * (select hearts from boss_config where id = 1),
         starts_at = now() + interval '5 seconds',
         ends_at   = now() + interval '65 seconds'
   where id = g.id;
  return _boss_state(g.id, v_me);
end; $$;

-- ── 7. Še enkrat (gostitelj) ──────────────────────────────────────────────
create or replace function public.boss_rematch(p_code text, p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare g boss_games; v_me uuid; v_game uuid;
begin
  select p.id, p.game_id into v_me, v_game
    from boss_players p join boss_games b on b.id = p.game_id
   where p.token = p_token and b.code = trim(p_code);
  if v_me is null then return json_build_object('error', 'gone'); end if;
  perform _boss_tidy(v_game);
  select * into g from boss_games where id = v_game;
  if g.host_player is distinct from v_me then return json_build_object('error', 'not_host'); end if;
  if g.status = 'finished' then
    update boss_players set correct = 0, wrong = 0, last_seen = now() where game_id = g.id;
    update boss_games set status = 'lobby', starts_at = null, ends_at = null where id = g.id;
  end if;
  return _boss_state(g.id, v_me);
end; $$;

-- ── 8. Zapusti ────────────────────────────────────────────────────────────
-- Med bojem igralec ostane (njegovi streli so šteli), sicer odide takoj.
create or replace function public.boss_leave(p_code text, p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_game uuid;
begin
  select g.id into v_game from boss_games g join boss_players p on p.game_id = g.id
   where g.code = trim(p_code) and p.token = p_token;
  if v_game is null then return; end if;
  delete from boss_players p using boss_games g
   where p.token = p_token and g.id = p.game_id and g.status <> 'running';
  if not exists (select 1 from boss_players where game_id = v_game) then
    delete from boss_games where id = v_game;
  else
    perform _boss_tidy(v_game);
  end if;
end; $$;

-- ── 9. Odprti boji (za prijavljene učence: pridruži se z enim dotikom) ────
create or replace function public.boss_list_open(p_student uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  return coalesce((
    select json_agg(json_build_object(
             'code', g.code,
             'players', (select json_agg(p.name order by p.joined_at) from boss_players p where p.game_id = g.id))
           order by g.created_at desc)
      from boss_games g
     where g.status = 'lobby' and g.created_at > now() - interval '12 hours'
       and exists (select 1 from boss_players p where p.game_id = g.id
                    and p.last_seen > now() - interval '20 seconds')), '[]'::json);
end; $$;

-- ── 10. Pravice ───────────────────────────────────────────────────────────
revoke execute on function public._boss_state(uuid, uuid) from public, anon, authenticated;
revoke execute on function public._boss_tidy(uuid)        from public, anon, authenticated;
revoke execute on function public._boss_finish(uuid)      from public, anon, authenticated;
revoke execute on function public._boss_add(uuid, uuid)   from public, anon, authenticated;

-- ── Hitri test ────────────────────────────────────────────────────────────
-- select code, status, boss, hp, hearts, result from boss_games order by created_at desc limit 5;
-- select s.username, w.day from boss_wins w join students s on s.id = w.student_id order by w.day desc;
