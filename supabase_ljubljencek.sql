-- Brihta-MAT — ljubljenček (Do 20)
--
-- ZAKAJ: Do 20 ne daje cekinov (ti so za poštevanko). Ves trud gre v
-- ljubljenčka, ki ga učenec sam oblikuje. Ljubljenček raste z znanjem:
-- 6 mejnikov = 3 sklopi (do 10, do 20 brez prehoda, do 20 s prehodom) ×
-- (seštevanje, odštevanje). Mejniki odklepajo nove možnosti videza (prvi
-- štirje po dve, zadnja dva po eno); stopnje rasti so jajce → mladiček (1) →
-- mlad (3) → odrasel (5) → končna oblika (6). Do 20. 10. 2026 je bilo
-- 5 skupin in 10 mejnikov; ponoven zagon datoteke vse prestavi.
-- Vsaka sezona ima svojega ljubljenčka; stari ostanejo v zbirki.
--
-- KAJ JE V DATOTEKI:
--   1. do20_facts — vadba po posameznih računih (kot fact_stats pri
--      poštevanki). Samo TIPKOVNICA: v kvizu lahko otrok odgovor ugane.
--      Račun je PAR števil {x, y}, x ≤ y: 3 + 4, 4 + 3, 7 − 3 in 7 − 4 so
--      vsi par {3, 4} — ista "družina" računov, ločeno za + in −.
--   2. Pravilo mejnika (_pet_mastered) — enako strogo kot sličica pri
--      poštevanki: vsi pari skupine vsaj enkrat pravilno, vsaj 20 odgovorov,
--      vsaj 90 % pravilnih, vsaj 80 % pravilnih hitreje kot v 3 s.
--   3. student_pets, pet_state, pet_save — ljubljenček in njegov videz.
--      Kaj je odklenjeno, odloča baza; aplikacija samo riše.
--   3b. Priboljški in trgovina za ljubljenčka, spremljevalec ob liku.
--   4. merge_students z dodanimi bloki.
--
-- Datoteko lahko zaženeš večkrat: podatki in stikalo ostanejo.
--
-- Zahteva supabase_do20.sql in supabase_album.sql (sezone). Zaženi v
-- Supabase → SQL Editor (celo datoteko naenkrat).
--
-- STIKALO: ljubljenček je ob zagonu te datoteke ZAPRT — vidijo ga samo
-- preizkuševalci (pet_testers). Računi Do 20 se medtem beležijo za vse,
-- zato mejniki ob odprtju štejejo tudi vadbo od začetka sezone.
--   Dodaj preizkuševalca:  insert into pet_testers (student_id)
--                            select id from students where username in ('adr90', 'oto12')
--                            on conflict do nothing;
--   Odstrani:              delete from pet_testers where student_id =
--                            (select id from students where username = 'adr90');
--   Odpri za vse:          update pet_config set open = true;
--   Spet zapri:            update pet_config set open = false;

-- ── 1. Računi ─────────────────────────────────────────────────────────────
-- Skupina para — ista pravila kot do20Group v script.js.
create or replace function public._do20_group(x int, y int)
returns text language sql immutable as $$
  select case
    when x < 1 or y < 1 or x + y > 20 then null
    when x + y <= 10 then 'd10'
    when greatest(x, y) >= 10 and greatest(x, y) % 10 + least(x, y) <= 10 then 'b20'
    when greatest(x, y) <= 9 then 'pr'
  end;
$$;

-- Koliko parov ima skupina (enako za + in −). Preverjeno s kupom v script.js.
create or replace function public._do20_fact_count(p_grp text)
returns int language sql immutable as $$
  select case p_grp when 'd10' then 25 when 'b20' then 55 when 'pr' then 20 end;
$$;

create table if not exists do20_facts (
  student_id uuid     not null references students(id) on delete cascade,
  day        date     not null,
  grp        text     not null check (grp in ('d10', 'b20', 'pr')),
  op         text     not null check (op in ('p', 'm')),
  x          smallint not null,
  y          smallint not null,
  correct    int      not null default 0,
  wrong      int      not null default 0,
  timed      int      not null default 0,
  fast       int      not null default 0,
  primary key (student_id, day, grp, op, x, y),
  check (x <= y)
);
alter table do20_facts enable row level security;

-- Prehod (20. 10. 2026): vsak par dobi skupino po novih pravilih. Par ima
-- natanko eno skupino, zato ključ ne trči.
alter table do20_facts drop constraint if exists do20_facts_grp_check;
update do20_facts set grp = _do20_group(x, y) where grp is distinct from _do20_group(x, y);
alter table do20_facts add constraint do20_facts_grp_check check (grp in ('d10', 'b20', 'pr'));

-- p_data: [{"g":"pr","op":"p","x":5,"y":8,"c":1,"w":0,"n":1,"f":1}, ...]
-- Skupino določi baza iz para (stara aplikacija še pošilja p10 in dv).
create or replace function public.add_do20_facts(
  p_student uuid, p_day date, p_data jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from students where id = p_student) then return; end if;

  insert into do20_facts (student_id, day, grp, op, x, y, correct, wrong, timed, fast)
  select p_student, p_day, _do20_group((e->>'x')::int, (e->>'y')::int), e->>'op', (e->>'x')::smallint, (e->>'y')::smallint,
         greatest(0, least(500, coalesce((e->>'c')::int, 0))),
         greatest(0, least(500, coalesce((e->>'w')::int, 0))),
         greatest(0, least(500, coalesce((e->>'n')::int, 0))),
         greatest(0, least(500, coalesce((e->>'f')::int, 0)))
    from jsonb_array_elements(coalesce(p_data, '[]'::jsonb)) e
   where (e->>'x') ~ '^[0-9]{1,2}$' and (e->>'y') ~ '^[0-9]{1,2}$'
     and (e->>'x')::int <= (e->>'y')::int
     and e->>'op' in ('p', 'm')
     and _do20_group((e->>'x')::int, (e->>'y')::int) is not null
  on conflict (student_id, day, grp, op, x, y) do update
     set correct = do20_facts.correct + excluded.correct,
         wrong   = do20_facts.wrong   + excluded.wrong,
         timed   = do20_facts.timed   + excluded.timed,
         fast    = do20_facts.fast    + excluded.fast;
end; $$;

-- ── 2. Mejnik ─────────────────────────────────────────────────────────────
-- Napredek ene skupine v obdobju — za mejnik in za "še ti manjka" na strani.
create or replace function public._pet_progress(
  p_student uuid, p_grp text, p_op text, p_from date, p_to date)
returns table(facts_done int, facts_total int, answers int, correct int, timed int, fast int)
language sql stable security definer set search_path = public as $$
  select (count(distinct (x, y)) filter (where correct > 0))::int,
         _do20_fact_count(p_grp),
         coalesce(sum(correct + wrong), 0)::int, coalesce(sum(correct), 0)::int,
         coalesce(sum(timed), 0)::int,           coalesce(sum(fast), 0)::int
    from (select x, y, sum(correct) correct, sum(wrong) wrong, sum(timed) timed, sum(fast) fast
            from do20_facts
           where student_id = p_student and grp = p_grp and op = p_op
             and day between p_from and p_to
           group by x, y) f;
$$;

create or replace function public._pet_mastered(
  p_student uuid, p_grp text, p_op text, p_from date, p_to date)
returns boolean language sql stable security definer set search_path = public as $$
  select facts_done >= facts_total
     and answers >= 20
     and correct >= 0.9 * answers
     and timed > 0
     and fast >= 0.8 * timed
    from _pet_progress(p_student, p_grp, p_op, p_from, p_to);
$$;

-- Koliko mejnikov je učenec dosegel v obdobju (0–6).
create or replace function public._pet_count(p_student uuid, p_from date, p_to date)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int
    from unnest(array['d10', 'b20', 'pr']) g, unnest(array['p', 'm']) o
   where _pet_mastered(p_student, g, o, p_from, p_to);
$$;

-- ── 3. Ljubljenček ────────────────────────────────────────────────────────
-- Stikalo: ena vrstica, privzeto zaprto. Ponoven zagon datoteke stikala ne
-- prestavi (on conflict do nothing).
create table if not exists pet_config (
  id   int     primary key default 1 check (id = 1),
  open boolean not null default false
);
insert into pet_config (id, open) values (1, false) on conflict (id) do nothing;
alter table pet_config enable row level security;

create table if not exists pet_testers (
  student_id uuid primary key references students(id) on delete cascade,
  since      date not null default current_date
);
alter table pet_testers enable row level security;

-- Ali učenec ljubljenčka vidi.
create or replace function public._pet_visible(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select open from pet_config where id = 1), false)
      or exists (select 1 from pet_testers where student_id = p_student);
$$;

-- Vrste po sezonah. Risbe so v pet-art.js — ime vrste mora biti tam enako.
create or replace function public._pet_species(p_season smallint)
returns text[] language sql immutable as $$
  select case p_season when 1 then array['zmaj', 'lisica', 'sova', 'macka']
                       else array['zmaj', 'lisica', 'sova', 'macka'] end;
$$;

-- Videz. Prosto: prve štiri barve (oblak = siva, dodana z mucko), vse barve trebuščka, tri barve oči, brez
-- vzorca. Mejniki odklepajo v tem vrstnem redu (enak seznam je v
-- pet-art.js, UNLOCKS); pri katerem mejniku, pove _pet_unlock_at (UNLOCK_AT):
create or replace function public._pet_unlocks()
returns text[] language sql immutable as $$
  select array['malina', 'pike', 'sliva', 'proge', 'koral', 'zvezde',
               'polnoc', 'srcki', 'zlata', 'mavrica'];
$$;
create or replace function public._pet_unlock_at(p_val text)
returns int language sql immutable as $$
  select (array[1, 1, 2, 2, 3, 3, 4, 4, 5, 6])[array_position(_pet_unlocks(), p_val)];
$$;
create or replace function public._pet_allowed(p_kind text, p_val text, p_count int)
returns boolean language sql immutable as $$
  select case p_kind
    when 'body'    then p_val in ('gozd', 'med', 'nebo', 'oblak')
                     or (p_val in ('malina', 'sliva', 'koral', 'polnoc', 'zlata')
                         and _pet_unlock_at(p_val) <= p_count)
    when 'belly'   then p_val in ('krema', 'breskev', 'meta', 'sivka')
    when 'eyes'    then p_val in ('rjave', 'zelene', 'modre')
                     or (p_val = 'zvezde' and _pet_unlock_at(p_val) <= p_count)
    when 'pattern' then p_val = 'brez'
                     or (p_val in ('pike', 'proge', 'srcki', 'mavrica')
                         and _pet_unlock_at(p_val) <= p_count)
    else false end;
$$;

create table if not exists student_pets (
  student_id uuid     not null references students(id) on delete cascade,
  season     smallint not null,
  species    text     not null,
  name       text     not null default '',
  body       text     not null default 'gozd',
  belly      text     not null default 'krema',
  eyes       text     not null default 'rjave',
  pattern    text     not null default 'brez',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, season)
);
alter table student_pets enable row level security;
-- oprema iz trgovine (3b): {"glava": "kapa", "vrat": "sal", "obraz": "ocala"}
alter table student_pets add column if not exists equip jsonb not null default '{}'::jsonb;
-- 19. 10. 2026: ježka je zamenjala mucka (pet-art.js riše stare ježke kot mucke)
update student_pets set species = 'macka' where species = 'jez';

-- Stopnja rasti iz števila mejnikov.
create or replace function public._pet_stage(p_count int)
returns text language sql immutable as $$
  select case when p_count >= 6 then 'koncna' when p_count >= 5 then 'odrasel'
              when p_count >= 3 then 'mlad' when p_count >= 1 then 'mladicek' else 'jajce' end;
$$;

-- ── 3b. Priboljški, trgovina, spremljevalec ──────────────────────────────
-- PRIBOLJŠKI so valuta samo za ljubljenčka; nikoli se ne spremenijo v
-- cekine. Baza jih izračuna iz vadbe Do 20 (nič se ne pošilja "+5"):
--   na dan: 1 za vsakih 10 pravilnih na tipkovnici (do20_facts),
--           1 za vsakih 20 pravilnih v kvizu (do20_stats minus tipkovnica),
--           +5, če je bilo tisti dan vsaj 10 pravilnih (dan vadbe),
--           skupaj največ 20 na dan — nagrajuje vračanje, ne garanja.
-- Stanje = vsi zasluženi − cene kupljenega. Kupljeno ostane za vedno in
-- ga lahko nosi vsak ljubljenček (tudi iz prejšnjih sezon).
create or replace function public._pet_treats_by_day(p_student uuid)
returns table(day date, treats int)
language sql stable security definer set search_path = public as $$
  select d.day,
         least(20, (coalesce(k.c, 0) / 10) + (greatest(d.c - coalesce(k.c, 0), 0) / 20)
                   + case when d.c >= 10 then 5 else 0 end)::int
    from (select day, sum(correct)::int c from do20_stats
           where student_id = p_student group by day) d
    left join (select day, sum(correct)::int c from do20_facts
                where student_id = p_student group by day) k using (day);
$$;

create table if not exists pet_shop (
  id     text     primary key,
  slot   text     not null check (slot in ('glava', 'vrat', 'obraz')),
  price  int      not null check (price > 0),
  season smallint not null default 1
);
alter table pet_shop enable row level security;
-- Risbe so v pet-art.js (ACC) — imena morajo biti enaka.
insert into pet_shop (id, slot, price) values
  ('pentlja',   'glava', 15), ('rozica', 'glava', 20), ('kapa', 'glava', 35), ('celada', 'glava', 40), ('cilinder', 'glava', 50),
  ('ovratnica', 'vrat',  15), ('sal',    'vrat',  25), ('metuljcek', 'vrat', 30),
  ('ocala',     'obraz', 30), ('soncna', 'obraz', 45)
on conflict (id) do update set slot = excluded.slot, price = excluded.price;

create table if not exists pet_items (
  student_id uuid not null references students(id) on delete cascade,
  item_id    text not null references pet_shop(id),
  price      int  not null,            -- cena ob nakupu (če se cena kasneje spremeni)
  bought_at  timestamptz not null default now(),
  primary key (student_id, item_id)
);
alter table pet_items enable row level security;

create or replace function public._pet_balance(p_student uuid)
returns int language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(treats) from _pet_treats_by_day(p_student)), 0)
        - coalesce((select sum(price) from pet_items where student_id = p_student), 0))::int;
$$;

-- Kateri ljubljenček (iz katere sezone) spremlja lik. Brez vrstice = nobeden;
-- takrat ostane spremljevalec iz trgovine lika (sova …).
create table if not exists pet_companion (
  student_id uuid     primary key references students(id) on delete cascade,
  season     smallint not null
);
alter table pet_companion enable row level security;

-- Ljubljenček ene sezone, s stopnjo, ki jo je v tisti sezoni dosegel.
create or replace function public._pet_json(p_student uuid, p_season smallint)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
           'season', p.season, 'season_name', se.name,
           'species', p.species, 'name', p.name, 'body', p.body, 'belly', p.belly,
           'eyes', p.eyes, 'pattern', p.pattern, 'equip', p.equip,
           'stage', _pet_stage(_pet_count(p_student, coalesce(se.starts, _album_today()),
                                          least(se.ends, _album_today()))))
    from student_pets p join seasons se on se.id = p.season
   where p.student_id = p_student and p.season = p_season;
$$;

-- Vse, kar potrebuje stran ljubljenčka.
create or replace function public.pet_state(p_student uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare s seasons; v_to date; v_count int;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  -- zaprto: kot da sezone ni — aplikacija gumba ne pokaže
  if not _pet_visible(p_student) then return json_build_object('season', null, 'hidden', true); end if;
  s := _album_season_for(p_student);
  v_to := _album_today();

  if s.id is not null then v_count := _pet_count(p_student, s.starts, v_to); end if;

  return json_build_object(
    'season', case when s.id is null then null
                   else json_build_object('id', s.id, 'name', s.name, 'from', s.starts, 'to', s.ends) end,
    'species', case when s.id is null then '[]'::json else to_json(_pet_species(s.id)) end,
    'count', coalesce(v_count, 0),
    'stage', _pet_stage(coalesce(v_count, 0)),
    'unlocks', to_json(_pet_unlocks()),
    'pet', (select json_build_object('species', species, 'name', name, 'body', body, 'belly', belly,
                                     'eyes', eyes, 'pattern', pattern, 'equip', equip)
              from student_pets where student_id = p_student and season = s.id),
    'treats', json_build_object(
       'balance', _pet_balance(p_student),
       'today', coalesce((select treats from _pet_treats_by_day(p_student) where day = v_to), 0),
       'cap', 20),
    'shop', coalesce((select json_agg(json_build_object('id', id, 'slot', slot, 'price', price) order by slot, price)
                        from pet_shop where season <= coalesce(s.id, 1)), '[]'::json),
    'owned', coalesce((select json_agg(item_id) from pet_items where student_id = p_student), '[]'::json),
    'companion', (select _pet_json(p_student, c.season) from pet_companion c where c.student_id = p_student),
    'milestones', case when s.id is null then '[]'::json else (
       select json_agg(json_build_object(
                'g', g, 'op', o,
                'done', _pet_mastered(p_student, g, o, s.starts, v_to),
                'facts_done', pr.facts_done, 'facts_total', pr.facts_total,
                'answers', pr.answers, 'correct', pr.correct,
                'timed', pr.timed, 'fast', pr.fast) order by gi, oi)
         from unnest(array['d10', 'b20', 'pr']) with ordinality g(g, gi),
              unnest(array['p', 'm']) with ordinality o(o, oi),
              lateral _pet_progress(p_student, g, o, s.starts, v_to) pr) end,
    -- zbirka: ljubljenčki preteklih sezon, s stopnjo, ki so jo dosegli
    'collection', coalesce((
       select json_agg(_pet_json(p_student, p.season) order by p.season)
         from student_pets p join seasons se on se.id = p.season
        where p.student_id = p_student and p.season is distinct from s.id
          and se.starts is not null), '[]'::json)
  );
end; $$;

-- Shrani videz. Vrsto je mogoče zamenjati samo, dokler je ljubljenček še
-- jajce; ko se izvali, ostane. Vrne pet_state ali {"error": ...}.
create or replace function public.pet_save(
  p_student uuid, p_species text, p_name text,
  p_body text, p_belly text, p_eyes text, p_pattern text)
returns json language plpgsql security definer set search_path = public as $$
declare s seasons; v_count int; v_old text; v_name text;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  if not _pet_visible(p_student) then return json_build_object('error', 'ZAPRTO'); end if;
  s := _album_season_for(p_student);
  if s.id is null then return json_build_object('error', 'NI_SEZONE'); end if;
  perform pg_advisory_xact_lock(hashtext('pet:' || p_student::text));

  v_count := _pet_count(p_student, s.starts, _album_today());
  v_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if length(v_name) > 14 or v_name !~ '^[[:alpha:] ]*$' or _ime_prepovedano(v_name) then
    return json_build_object('error', 'IME');
  end if;
  if not (p_species = any(_pet_species(s.id))) then return json_build_object('error', 'VRSTA'); end if;
  if not (_pet_allowed('body', p_body, v_count) and _pet_allowed('belly', p_belly, v_count)
          and _pet_allowed('eyes', p_eyes, v_count) and _pet_allowed('pattern', p_pattern, v_count)) then
    return json_build_object('error', 'ZAKLENJENO');
  end if;

  select species into v_old from student_pets where student_id = p_student and season = s.id;
  if v_old is not null and v_old <> p_species and v_count > 0 then
    return json_build_object('error', 'IZVALJEN');
  end if;

  insert into student_pets (student_id, season, species, name, body, belly, eyes, pattern)
  values (p_student, s.id, p_species, v_name, p_body, p_belly, p_eyes, p_pattern)
  on conflict (student_id, season) do update
     set species = excluded.species, name = excluded.name, body = excluded.body,
         belly = excluded.belly, eyes = excluded.eyes, pattern = excluded.pattern,
         updated_at = now();

  return pet_state(p_student);
end; $$;

-- Nakup v trgovini. Vrne pet_state ali {"error": ...}.
create or replace function public.pet_buy(p_student uuid, p_item text)
returns json language plpgsql security definer set search_path = public as $$
declare v_price int;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  if not _pet_visible(p_student) then return json_build_object('error', 'ZAPRTO'); end if;
  perform pg_advisory_xact_lock(hashtext('pet:' || p_student::text));
  select price into v_price from pet_shop where id = p_item;
  if v_price is null then return json_build_object('error', 'NI_PREDMETA'); end if;
  if exists (select 1 from pet_items where student_id = p_student and item_id = p_item) then
    return json_build_object('error', 'ZE_IMAS');
  end if;
  if _pet_balance(p_student) < v_price then return json_build_object('error', 'PREMALO'); end if;
  insert into pet_items (student_id, item_id, price) values (p_student, p_item, v_price);
  return pet_state(p_student);
end; $$;

-- Obleci (p_item) ali sleci (p_item null) predmet ljubljenčku te sezone.
create or replace function public.pet_equip(p_student uuid, p_slot text, p_item text)
returns json language plpgsql security definer set search_path = public as $$
declare s seasons;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  if not _pet_visible(p_student) then return json_build_object('error', 'ZAPRTO'); end if;
  if p_slot not in ('glava', 'vrat', 'obraz') then return json_build_object('error', 'REZA'); end if;
  s := _album_season_for(p_student);
  if s.id is null then return json_build_object('error', 'NI_SEZONE'); end if;
  if nullif(p_item, '') is not null and not exists (
       select 1 from pet_items i join pet_shop sh on sh.id = i.item_id
        where i.student_id = p_student and i.item_id = p_item and sh.slot = p_slot) then
    return json_build_object('error', 'NI_TVOJE');
  end if;
  update student_pets
     set equip = case when nullif(p_item, '') is null then equip - p_slot
                      else equip || jsonb_build_object(p_slot, p_item) end,
         updated_at = now()
   where student_id = p_student and season = s.id;
  if not found then return json_build_object('error', 'NI_LJUBLJENCKA'); end if;
  return pet_state(p_student);
end; $$;

-- Ljubljenček (iz te ali prejšnje sezone) gre z likom; null = nobeden.
-- Jajce ne more iti: najprej se mora izvaliti.
create or replace function public.pet_set_companion(p_student uuid, p_season smallint)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  if not _pet_visible(p_student) then return json_build_object('error', 'ZAPRTO'); end if;
  if p_season is null then
    delete from pet_companion where student_id = p_student;
    return pet_state(p_student);
  end if;
  if coalesce(_pet_json(p_student, p_season)->>'stage', 'jajce') = 'jajce' then
    return json_build_object('error', 'JAJCE');
  end if;
  insert into pet_companion (student_id, season) values (p_student, p_season)
  on conflict (student_id) do update set season = excluded.season;
  return pet_state(p_student);
end; $$;

-- ── 4. Združevanje računov učencev ────────────────────────────────────────
-- Ista funkcija kot v supabase_do20.sql, z dodanimi bloki za do20_facts,
-- student_pets, pet_testers, pet_items in pet_companion. Ta datoteka je
-- zdaj zadnja različica.
create or replace function public.merge_students(
  p_teacher_id uuid, p_from text, p_into text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_from uuid; v_into uuid;
begin
  if not exists (
    select 1 from teachers where id = p_teacher_id and approved
  ) then
    return 'NI_DOVOLJENJA';
  end if;

  select id into v_from from students where lower(username) = lower(btrim(coalesce(p_from, '')));
  select id into v_into from students where lower(username) = lower(btrim(coalesce(p_into, '')));
  if v_from is null or v_into is null then return 'NI_UCENCA'; end if;
  if v_from = v_into then return 'ISTI'; end if;

  begin
    -- stats: kjer imata oba isti dan in način, prištej k eni vrstici ciljnega
    -- računa; ostale vrstice samo prestavi.
    update stats t
       set correct = coalesce(t.correct, 0) + f.correct,
           wrong   = coalesce(t.wrong,   0) + f.wrong,
           points  = coalesce(t.points,  0) + f.points,
           seconds = coalesce(t.seconds, 0) + f.seconds
      from (select day, mode,
                   coalesce(sum(correct), 0) as correct, coalesce(sum(wrong), 0) as wrong,
                   coalesce(sum(points),  0) as points,  coalesce(sum(seconds), 0) as seconds
              from stats where student_id = v_from group by day, mode) f
     where t.ctid = (select s2.ctid from stats s2
                      where s2.student_id = v_into and s2.day = f.day and s2.mode = f.mode
                      limit 1);
    delete from stats f
     where f.student_id = v_from
       and exists (select 1 from stats t
                    where t.student_id = v_into and t.day = f.day and t.mode = f.mode);
    update stats set student_id = v_into where student_id = v_from;

    -- table_stats: enako, ključ je dan + poštevanka + operacija
    update table_stats t
       set correct = coalesce(t.correct, 0) + f.correct,
           wrong   = coalesce(t.wrong,   0) + f.wrong
      from (select day, table_n, op,
                   coalesce(sum(correct), 0) as correct, coalesce(sum(wrong), 0) as wrong
              from table_stats where student_id = v_from group by day, table_n, op) f
     where t.ctid = (select s2.ctid from table_stats s2
                      where s2.student_id = v_into and s2.day = f.day
                        and s2.table_n = f.table_n and s2.op = f.op
                      limit 1);
    delete from table_stats f
     where f.student_id = v_from
       and exists (select 1 from table_stats t
                    where t.student_id = v_into and t.day = f.day
                      and t.table_n = f.table_n and t.op = f.op);
    update table_stats set student_id = v_into where student_id = v_from;

    -- table_speed (supabase_hitrost.sql) ima primarni ključ, zato gre krajše
    insert into table_speed (student_id, day, table_n, op, timed, fast)
    select v_into, day, table_n, op, timed, fast
      from table_speed where student_id = v_from
    on conflict (student_id, day, table_n, op) do update
       set timed = table_speed.timed + excluded.timed,
           fast  = table_speed.fast  + excluded.fast;
    delete from table_speed where student_id = v_from;

    -- fact_stats (ta datoteka): enako kot table_speed, ključ ima še račun
    insert into fact_stats (student_id, day, table_n, op, factor, correct, wrong, timed, fast)
    select v_into, day, table_n, op, factor, correct, wrong, timed, fast
      from fact_stats where student_id = v_from
    on conflict (student_id, day, table_n, op, factor) do update
       set correct = fact_stats.correct + excluded.correct,
           wrong   = fact_stats.wrong   + excluded.wrong,
           timed   = fact_stats.timed   + excluded.timed,
           fast    = fact_stats.fast    + excluded.fast;
    delete from fact_stats where student_id = v_from;

    -- do20_stats (ta datoteka): enako kot fact_stats, ključ je skupina
    insert into do20_stats (student_id, day, grp, op, correct, wrong, timed, fast)
    select v_into, day, grp, op, correct, wrong, timed, fast
      from do20_stats where student_id = v_from
    on conflict (student_id, day, grp, op) do update
       set correct = do20_stats.correct + excluded.correct,
           wrong   = do20_stats.wrong   + excluded.wrong,
           timed   = do20_stats.timed   + excluded.timed,
           fast    = do20_stats.fast    + excluded.fast;
    delete from do20_stats where student_id = v_from;

    -- do20_facts (ta datoteka): enako, ključ ima še račun
    insert into do20_facts (student_id, day, grp, op, x, y, correct, wrong, timed, fast)
    select v_into, day, grp, op, x, y, correct, wrong, timed, fast
      from do20_facts where student_id = v_from
    on conflict (student_id, day, grp, op, x, y) do update
       set correct = do20_facts.correct + excluded.correct,
           wrong   = do20_facts.wrong   + excluded.wrong,
           timed   = do20_facts.timed   + excluded.timed,
           fast    = do20_facts.fast    + excluded.fast;
    delete from do20_facts where student_id = v_from;

    -- ljubljenčki: če ima ciljni račun v sezoni že svojega, ostane njegov
    insert into student_pets (student_id, season, species, name, body, belly, eyes, pattern, created_at, updated_at)
    select v_into, season, species, name, body, belly, eyes, pattern, created_at, updated_at
      from student_pets where student_id = v_from
    on conflict (student_id, season) do nothing;
    delete from student_pets where student_id = v_from;
    insert into pet_testers (student_id) select v_into from pet_testers where student_id = v_from
    on conflict do nothing;
    -- kupljeno ostane (cilj ohrani svoje, če ima isti predmet); spremljevalec ciljnega računa ostane
    insert into pet_items (student_id, item_id, price, bought_at)
    select v_into, item_id, price, bought_at from pet_items where student_id = v_from
    on conflict do nothing;
    insert into pet_companion (student_id, season)
    select v_into, season from pet_companion where student_id = v_from
    on conflict do nothing;

    -- Ime in razred: če jih ciljni račun nima, jih vzemi od starega
    update students t
       set display_name = coalesce(t.display_name, f.display_name),
           letnik       = coalesce(t.letnik,       f.letnik),
           oddelek      = coalesce(t.oddelek,      f.oddelek)
      from students f
     where t.id = v_into and f.id = v_from;

    delete from students where id = v_from;
  exception when others then
    return 'NAPAKA: ' || sqlerrm;
  end;

  return 'OK';
end; $$;

-- ── Hitri test ────────────────────────────────────────────────────────────
-- select open from pet_config;
-- select s.username from pet_testers t join students s on s.id = t.student_id;
-- select pet_state(id) from students where username = 'adr90';
-- select s.username, f.* from do20_facts f join students s on s.id = f.student_id
--  order by f.day desc, s.username, f.grp, f.op, f.x, f.y limit 50;
