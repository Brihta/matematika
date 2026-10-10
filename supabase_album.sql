-- Brihta-MAT — album, cekini in lik (gamifikacija, 1. del: jedro)
--
-- ZAKAJ: učenci zbirajo sličice za pravo znanje, sličice prinesejo cekine,
-- cekini kupijo opremo za sezonski lik (jesen: vitez/vitezinja). Zasnova in
-- vse odločitve so v gamifikacija/README.md (lokalno, ni na GitHubu).
--
-- VSE ODLOČA STREŽNIK. Aplikacija nikoli ne pošlje "daj mi 20 cekinov" ali
-- "imam sličico 7 ×". Pošlje samo odgovore (to že počne), ta datoteka pa iz
-- njih sama ugotovi, katere sličice so zaslužene, in sama vodi cekine, cene
-- in nakupe. Ključ v script.js je javen, zato do tabel ni neposrednega
-- dostopa (RLS brez pravil) — vse gre prek funkcij spodaj, kot povsod drugje.
--
-- V TEM DELU: sezone, strani Poštevanke, Zvestoba, Tekmovanje in Bitka,
-- cekini, trgovina, videz lika. Pogum in razredni cilj pridejo kasneje.
-- Tekmovanje ima svoj zapis po učencu (comp_rounds): javna lestvica
-- "scores" ni vezana na učenca, zato sličice ne gradijo na njej.
--
-- Zahteva: supabase_racuni.sql (tabela fact_stats).
-- Zaženi v Supabase → SQL Editor (celo datoteko naenkrat). Varno jo je
-- zagnati večkrat: tabele se ne podvojijo, katalog se posodobi.

-- ══════════════════════════════════════════════════════════════════════════
-- 1. KATALOG (sezone, liki, sličice, predmeti) — ureja samo učitelj v SQL
-- ══════════════════════════════════════════════════════════════════════════

create table if not exists seasons (
  id       smallint primary key,
  name     text not null,
  char_id  text not null,          -- lik sezone za nove učence
  starts   date,                   -- null = še ni začela
  ends     date not null
);

create table if not exists game_chars (
  id      text primary key,        -- 'vitez', 'carovnik'
  season  smallint not null        -- od katere sezone je na voljo
);

-- Šolski dnevi brez pouka (počitnice, prazniki), da niz "dni zapored" ne
-- poči. Sobote in nedelje se izpustijo same. Vpiši ročno, npr.:
--   insert into prosti_dnevi values ('2026-12-25', 'božič');
create table if not exists prosti_dnevi (
  dan  date primary key,
  opis text
);

-- Sličice. kind določa pravilo:
--   welcome — dobi jo vsak ob prvem obisku sezone
--   table   — poštevanka t, operacija op obvladana v tej sezoni (fact_stats)
--   days    — vsaj n različnih dni vadbe v sezoni (dan = vsaj 10 pravilnih)
--   streak  — vsaj n šolskih dni vadbe zapored v sezoni
--   comp_first   — vsaj eno tekmovanje v sezoni
--   comp_score   — najboljša igra v sezoni vsaj n točk
--   comp_records — n-krat izboljšan osebni rekord v sezoni
--   comp_board   — vsaj enkrat med 10 najboljšimi dneva (lestvica)
--   battle_first  — vsaj ena odigrana bitka
--   battle_count  — vsaj n odigranih bitk
--   battle_podium — med prvimi tremi v bitki z vsaj 4 igralci
--   battle_mates  — igral z vsaj n različnimi sošolci (prijavljenimi)
--   battle_win    — zmaga v bitki (vsaj 2 igralca)
--   battle_host   — gostitelj bitke z vsaj 3 igralci
create table if not exists album_stickers (
  season  smallint not null references seasons(id),
  id      text     not null,
  page    text     not null,       -- 'post', 'zve' (2. del: 'tek', 'bit', 'pog')
  kind    text     not null,
  t       smallint,
  op      text check (op in ('x', 'd')),
  n       int,
  primary key (season, id)
);

-- Pravilo za vrste sličic (tudi za tabelo, ustvarjeno s prejšnjo različico).
alter table album_stickers drop constraint if exists album_stickers_kind_check;
alter table album_stickers add constraint album_stickers_kind_check check (kind in
  ('welcome', 'table', 'days', 'streak', 'comp_first', 'comp_score', 'comp_records', 'comp_board',
   'battle_first', 'battle_count', 'battle_podium', 'battle_mates', 'battle_win', 'battle_host'));

-- Predmeti. Cena null = ni naprodaj (nagrada). Cena 0 = dobi ga vsak.
-- char_id null = skupno vsem likom (spremljevalci, svetovi).
create table if not exists items (
  id            text primary key,
  season        smallint not null,
  char_id       text,
  slot          text not null check (slot in ('glava', 'obleka', 'v-roki', 'scit', 'hrbet', 'spremljevalec', 'ozadje')),
  price         int check (price >= 0),
  reward_season smallint,          -- nagrada za polno stran te sezone …
  reward_page   text               -- … in te strani ('razred' = cilj razreda)
);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. PODATKI UČENCA
-- ══════════════════════════════════════════════════════════════════════════

-- Katerega lika gradi učenec v sezoni (sličice sezone štejejo njemu za čin).
create table if not exists student_season_char (
  student_id uuid     not null references students(id) on delete cascade,
  season     smallint not null references seasons(id),
  char_id    text     not null references game_chars(id),
  primary key (student_id, season)
);

create table if not exists student_stickers (
  student_id uuid     not null references students(id) on delete cascade,
  season     smallint not null,
  sticker_id text     not null,
  state      text     not null default 'pending' check (state in ('pending', 'have')),
  gold       boolean  not null default false,
  earned_at  timestamptz not null default now(),   -- ko je pogoj izpolnjen (v ovojnici)
  stuck_at   timestamptz,                          -- ko jo prilepi (dobi cekine)
  gold_at    timestamptz,
  primary key (student_id, season, sticker_id),
  foreign key (season, sticker_id) references album_stickers(season, id)
);

-- Cekini: vsak premik je ena vrstica, stanje je vsota. Enolični (reason, ref)
-- pomeni, da se ista sličica ali isti nakup nikoli ne šteje dvakrat.
create table if not exists coin_ledger (
  id         bigserial primary key,
  student_id uuid not null references students(id) on delete cascade,
  amount     int  not null,
  reason     text not null check (reason in ('sticker', 'gold', 'buy')),
  ref        text not null,
  created_at timestamptz not null default now(),
  unique (student_id, reason, ref)
);

create table if not exists student_items (
  student_id  uuid not null references students(id) on delete cascade,
  item_id     text not null references items(id),
  source      text not null check (source in ('start', 'buy', 'reward')),
  acquired_at timestamptz not null default now(),
  primary key (student_id, item_id)
);

-- Videz in oblečeno. equip: {"vitez": {"obleka": "oklep", "glava": "celada", …}}
create table if not exists student_avatar (
  student_id  uuid primary key references students(id) on delete cascade,
  form        text not null default 'm' check (form in ('m', 'f')),   -- vitez / vitezinja
  skin        text not null default '#f7d2b4',
  hair        text not null default '#5a3a24',
  eye         text not null default '#4a8a3c',
  style       text not null default 'kratki',
  active_char text,
  equip       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Preizkusni način: ti učenci vidijo sezono, še preden jo odpreš za vse.
-- since = od katerega dne se jim šteje vadba (kot začetek sezone).
create table if not exists album_testers (
  student_id uuid primary key references students(id) on delete cascade,
  since      date not null default current_date
);

-- Tekmovanje: vsaka igra prijavljenega učenca. Piše samo add_comp_round, ki
-- preveri, da je rezultat mogoč. Javna lestvica (scores) ostane, kot je.
create table if not exists comp_rounds (
  id         bigserial primary key,
  student_id uuid not null references students(id) on delete cascade,
  day        date not null,
  score      int  not null check (score between 0 and 300),
  correct    int  not null check (correct >= 0),
  wrong      int  not null check (wrong >= 0),
  created_at timestamptz not null default now()
);
create index if not exists comp_rounds_student on comp_rounds (student_id, day);

-- Bitka (supabase_bitka.sql): igralci so doslej le imena in bitke se po
-- 12 urah pobrišejo. student_id poveže igralca z računom — nastavi ga
-- battle_claim, ki ga pokliče naprava, ki ima skrivni žeton igralca.
-- battle_log je trajni dnevnik: zapiše ga baza sama, ko se bitka konča.
alter table battle_players add column if not exists student_id uuid references students(id) on delete set null;
create table if not exists battle_log (
  student_id uuid    not null references students(id) on delete cascade,
  battle_id  uuid    not null,
  round      int     not null,
  day        date    not null,
  place      int     not null,         -- 1 = zmaga (izenačeni delijo mesto)
  players    int     not null,
  host       boolean not null,
  mates      text[]  not null default '{}',   -- uporabniška imena prijavljenih soigralcev
  correct    int     not null,
  wrong      int     not null,
  created_at timestamptz not null default now(),
  primary key (student_id, battle_id, round)
);

-- Frizure (videz je brezplačen). Pravilo tudi za tabelo, ustvarjeno s prejšnjo različico.
alter table student_avatar drop constraint if exists student_avatar_style_check;
alter table student_avatar add constraint student_avatar_style_check
  check (style in ('kratki', 'dolgi', 'kitke', 'cop'));

alter table seasons             enable row level security;
alter table game_chars          enable row level security;
alter table prosti_dnevi        enable row level security;
alter table album_stickers      enable row level security;
alter table items               enable row level security;
alter table student_season_char enable row level security;
alter table student_stickers    enable row level security;
alter table coin_ledger         enable row level security;
alter table student_items       enable row level security;
alter table student_avatar      enable row level security;
alter table album_testers       enable row level security;
alter table comp_rounds         enable row level security;
alter table battle_log          enable row level security;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. VSEBINA 1. SEZONE (jesen: vitez / vitezinja)
-- ══════════════════════════════════════════════════════════════════════════

-- Sezona 1 je ustvarjena, a še NI začela (starts = null). Ko je vse
-- pripravljeno, jo začneš z:
--   update seasons set starts = current_date where id = 1;
insert into seasons (id, name, char_id, starts, ends)
values (1, 'Jesen', 'vitez', null, '2026-12-31')
on conflict (id) do update set name = excluded.name, char_id = excluded.char_id, ends = excluded.ends;

insert into game_chars (id, season) values ('vitez', 1), ('carovnik', 2)
on conflict (id) do update set season = excluded.season;

-- Poštevanke: 20 predalov (× in ÷), Zvestoba: dobrodošlica + niz + dnevi.
insert into album_stickers (season, id, page, kind, t, op, n)
select 1, op || t, 'post', 'table', t, op, null
  from generate_series(1, 10) t, (values ('x'), ('d')) o(op)
on conflict (season, id) do update set page = excluded.page, kind = excluded.kind, t = excluded.t, op = excluded.op, n = excluded.n;

insert into album_stickers (season, id, page, kind, n) values
  (1, 'z0', 'zve', 'welcome', null),
  (1, 'z1', 'zve', 'streak', 3),
  (1, 'z2', 'zve', 'streak', 5),
  (1, 'z3', 'zve', 'streak', 10),
  (1, 'z4', 'zve', 'streak', 20),
  (1, 'z5', 'zve', 'days', 50)
on conflict (season, id) do update set page = excluded.page, kind = excluded.kind, n = excluded.n;

-- Tekmovanje. Meje iz 1.066 iger (sept.–okt. 2026): četrtina iger ≥ 12 točk,
-- polovica ≥ 23, četrtina najboljših ≥ 41, 10 % ≥ 57, 3 % ≥ 74.
insert into album_stickers (season, id, page, kind, n) values
  (1, 't0', 'tek', 'comp_first',   null),
  (1, 't1', 'tek', 'comp_score',   10),    -- lesena
  (1, 't2', 'tek', 'comp_score',   20),    -- železna
  (1, 't3', 'tek', 'comp_score',   40),    -- bronasta
  (1, 't4', 'tek', 'comp_score',   55),    -- srebrna
  (1, 't5', 'tek', 'comp_score',   75),    -- zlata
  (1, 't6', 'tek', 'comp_records', 5),
  (1, 't7', 'tek', 'comp_board',   null)
on conflict (season, id) do update set page = excluded.page, kind = excluded.kind, n = excluded.n;

-- Bitka. Večina sličic je za sodelovanje, ena za zmago.
insert into album_stickers (season, id, page, kind, n) values
  (1, 'b0', 'bit', 'battle_first',  null),
  (1, 'b1', 'bit', 'battle_count',  10),
  (1, 'b2', 'bit', 'battle_podium', null),
  (1, 'b3', 'bit', 'battle_mates',  5),
  (1, 'b4', 'bit', 'battle_win',    null),
  (1, 'b5', 'bit', 'battle_host',   null)
on conflict (season, id) do update set page = excluded.page, kind = excluded.kind, n = excluded.n;

-- Predmeti 1. sezone (cene iz gamifikacija/README.md).
insert into items (id, season, char_id, slot, price, reward_season, reward_page) values
  ('oproda',       1, 'vitez', 'obleka',        0,    null, null),
  ('verizna',      1, 'vitez', 'obleka',        80,   null, null),
  ('oklep',        1, 'vitez', 'obleka',        220,  null, null),
  ('celada-modra', 1, 'vitez', 'glava',         160,  null, null),
  ('veliki-slem',  1, 'vitez', 'glava',         300,  null, null),   -- viteška bojna čelada (dodana 10. 10. 2026)
  ('kapuca',       1, null,    'obleka',        120,  null, null),   -- temna kapuca z ovratnikom in tuniko, za vse like (oblačilo od 11. 10. 2026)
  ('celada',       1, 'vitez', 'glava',         null, 1, 'bit'),
  ('krona',        1, 'vitez', 'glava',         null, 1, 'tek'),
  ('lesen-mec',    1, 'vitez', 'v-roki',        0,    null, null),
  ('mec',          1, 'vitez', 'v-roki',        100,  null, null),
  ('buzdovan',     1, 'vitez', 'v-roki',        200,  null, null),   -- buzdovan (bojni cepec), dodan 11. 10. 2026
  ('zlati-mec',    1, 'vitez', 'v-roki',        350,  null, null),
  ('scit-les',     1, 'vitez', 'scit',          60,   null, null),
  ('scit-zvezda',  1, 'vitez', 'scit',          150,  null, null),
  ('scit-brihta',  1, 'vitez', 'scit',          null, 1, 'zve'),
  ('plasc',        1, 'vitez', 'hrbet',         120,  null, null),
  ('plasc-kralj',  1, 'vitez', 'hrbet',         300,  null, null),
  ('sova',         1, null,    'spremljevalec', null, 1, 'post'),
  ('mucek',        1, null,    'spremljevalec', 90,   null, null),
  ('lisicka',      1, null,    'spremljevalec', 180,  null, null),
  ('zmajcek',      1, null,    'spremljevalec', null, 2, 'zve'),
  ('travnik',      1, null,    'ozadje',        0,    null, null),
  ('zahod',        1, null,    'ozadje',        null, 1, 'pog'),
  ('grad',         1, null,    'ozadje',        null, 1, 'razred')
on conflict (id) do update set season = excluded.season, char_id = excluded.char_id, slot = excluded.slot,
  price = excluded.price, reward_season = excluded.reward_season, reward_page = excluded.reward_page;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. PRAVILA (pomožne funkcije, aplikacija jih ne kliče)
-- ══════════════════════════════════════════════════════════════════════════

-- Šolski dan je po slovenskem času, kot v aplikaciji (getTodayKey).
create or replace function public._album_today()
returns date language sql stable as $$
  select (now() at time zone 'Europe/Ljubljana')::date;
$$;

-- Sezona, ki teče danes (null, če nobena).
create or replace function public._album_season()
returns seasons language sql stable security definer set search_path = public as $$
  select * from seasons
   where starts is not null and starts <= _album_today() and ends >= _album_today()
   order by starts desc limit 1;
$$;

-- Sezona za tega učenca: prava, če teče; sicer za preizkuševalca prva
-- sezona, ki še ni odprta, z začetkom na dan, ko je postal preizkuševalec.
create or replace function public._album_season_for(p_student uuid)
returns seasons language plpgsql stable security definer set search_path = public as $$
declare s seasons; v_since date;
begin
  s := _album_season();
  if s.id is not null then return s; end if;
  select since into v_since from album_testers where student_id = p_student;
  if v_since is null then return s; end if;
  select * into s from seasons
   where (starts is null or starts > _album_today()) and ends >= _album_today()
   order by id limit 1;
  if s.id is not null then s.starts := least(v_since, _album_today()); end if;
  return s;
end; $$;

-- Obvladano (odločeno 5. 10. 2026): v obdobju vseh 10 računov vsaj enkrat
-- pravilno, vsaj 20 odgovorov, vsaj 90 % pravilnih, vsaj 80 % pravilnih
-- hitreje kot v 3 s. fact_stats vsebuje samo tipkovnico, tekmovanje, bitko.
create or replace function public._album_mastered(
  p_student uuid, p_t smallint, p_op text, p_from date, p_to date)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
           count(distinct factor) filter (where correct > 0) = 10
       and sum(correct + wrong) >= 20
       and sum(correct) >= 0.9 * sum(correct + wrong)
       and sum(timed) > 0
       and sum(fast) >= 0.8 * sum(timed), false)
    from fact_stats
   where student_id = p_student and table_n = p_t and op = p_op
     and day between p_from and p_to;
$$;

-- Zlata: poštevanko zna tudi 14 dni po sličici. Šteje samo vadba od tega
-- dne naprej: vsaj 10 odgovorov, 90 % pravilnih, 80 % hitrih.
create or replace function public._album_gold(
  p_student uuid, p_t smallint, p_op text, p_from date, p_to date)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
           sum(correct + wrong) >= 10
       and sum(correct) >= 0.9 * sum(correct + wrong)
       and sum(timed) > 0
       and sum(fast) >= 0.8 * sum(timed), false)
    from fact_stats
   where student_id = p_student and table_n = p_t and op = p_op
     and day between p_from and p_to;
$$;

-- Dnevi vadbe: dan, ko je učenec dal vsaj 10 pravilnih odgovorov (vsi načini).
create or replace function public._album_practice_days(p_student uuid, p_from date, p_to date)
returns table(day date) language sql stable security definer set search_path = public as $$
  select s.day from stats s
   where s.student_id = p_student and s.day between p_from and p_to
   group by s.day having sum(coalesce(s.correct, 0)) >= 10;
$$;

-- Niz: najdaljši in trenutni niz šolskih dni z vadbo. Sobote, nedelje in
-- prosti_dnevi se preskočijo, zato vikend ali počitnice niza ne prekinejo.
create or replace function public._album_streak(p_student uuid, p_from date, p_to date)
returns table(best int, now_len int)
language sql stable security definer set search_path = public as $$
  with school as (
    select d::date as day, row_number() over (order by d) as rn
      from generate_series(p_from, p_to, interval '1 day') d
     where extract(isodow from d) < 6
       and not exists (select 1 from prosti_dnevi p where p.dan = d::date)
  ), hit as (
    select s.day, s.rn, s.rn - row_number() over (order by s.rn) as grp
      from school s join _album_practice_days(p_student, p_from, p_to) pd on pd.day = s.day
  ), runs as (
    select grp, count(*)::int as len, max(rn) as last_rn from hit group by grp
  )
  select coalesce((select max(len) from runs), 0),
         -- trenutni niz: tisti, ki se konča na zadnjem šolskem dnevu
         -- ali na predzadnjem (danes še ni nujno vadil)
         coalesce((select len from runs
                    where last_rn >= (select max(rn) from school) - 1
                    order by last_rn desc limit 1), 0);
$$;

-- Tekmovanje v obdobju: koliko iger, najboljša igra, kolikokrat je otrok
-- izboljšal svoj rekord (primerja z vsemi prejšnjimi igrami, tudi pred
-- sezono) in ali je bil kakšen dan med 10 najboljšimi na lestvici dneva —
-- z rezultatom, ki ga potrjuje tudi njegova igra v comp_rounds.
create or replace function public._album_comp(p_student uuid, p_from date, p_to date)
returns table(rounds int, best int, records int, board boolean)
language sql stable security definer set search_path = public as $$
  with r as (
    select id, day, score,
           max(score) over (order by created_at, id
                            rows between unbounded preceding and 1 preceding) as prev_best
      from comp_rounds where student_id = p_student and day <= p_to
  )
  select (select count(*)::int from r where day >= p_from),
         (select coalesce(max(score), 0)::int from r where day >= p_from),
         (select count(*)::int from r where day >= p_from and prev_best is not null and score > prev_best),
         exists (select 1 from (select distinct day from r where day >= p_from) d
                  where exists (select 1 from get_daily_board(d.day) b
                                  join students st on st.id = p_student and lower(st.username) = lower(b.name)
                                 where b.score <= (select max(r2.score) from r r2 where r2.day = d.day)));
$$;

-- Bitke v obdobju (iz battle_log).
create or replace function public._album_battle(p_student uuid, p_from date, p_to date)
returns table(battles int, wins int, podiums int, hosted int, mates int)
language sql stable security definer set search_path = public as $$
  select count(*)::int,
         (count(*) filter (where place = 1 and players >= 2))::int,
         (count(*) filter (where place <= 3 and players >= 4))::int,
         (count(*) filter (where host and players >= 3))::int,
         (select count(distinct m)::int from battle_log b2, unnest(b2.mates) m
           where b2.student_id = p_student and b2.day between p_from and p_to)
    from battle_log
   where student_id = p_student and day between p_from and p_to;
$$;

-- Ko se bitka konča (status → 'finished', _battle_tidy), zapiši izid vsakega
-- prijavljenega igralca, ki je res igral (vsaj 5 odgovorov). Mesto in število
-- igralcev štejejo vse igralce, tudi neprijavljene. Sprožilec je tukaj, ne v
-- supabase_bitka.sql, zato bitka deluje enako, tudi če tega dela ni.
create or replace function public._battle_log_round()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'finished' and old.status is distinct from 'finished' then
    insert into battle_log (student_id, battle_id, round, day, place, players, host, mates, correct, wrong)
    select x.student_id, new.id, new.round, _album_today(), x.place, x.players,
           x.id = new.host_player,
           coalesce((select array_agg(distinct lower(s2.username))
                       from battle_players p2 join students s2 on s2.id = p2.student_id
                      where p2.battle_id = new.id and p2.id <> x.id and p2.student_id <> x.student_id), '{}'),
           x.correct, x.wrong
      from (select p.*, rank() over (order by p.score desc, p.correct desc)::int as place,
                   (count(*) over ())::int as players
              from battle_players p where p.battle_id = new.id) x
     where x.student_id is not null and x.correct + x.wrong >= 5
    on conflict do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists battle_log_round on battles;
create trigger battle_log_round after update on battles
  for each row execute function _battle_log_round();

-- ══════════════════════════════════════════════════════════════════════════
-- 5. STANJE ZA APLIKACIJO
-- ══════════════════════════════════════════════════════════════════════════

-- Vse, kar aplikacija rabi za prikaz albuma, opreme in lika — v enem klicu.
create or replace function public.album_state(p_student uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare s seasons; v_to date; v_char text;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  s := _album_season_for(p_student);
  v_to := least(_album_today(), s.ends);
  select char_id into v_char from student_season_char where student_id = p_student and season = s.id;

  return json_build_object(
    'season', case when s.id is null then null else json_build_object(
                'id', s.id, 'name', s.name, 'starts', s.starts, 'ends', s.ends,
                'days_left', s.ends - _album_today()) end,
    'char', v_char,
    'coins', coalesce((select sum(amount) from coin_ledger where student_id = p_student), 0),
    'stickers', coalesce((select json_agg(json_build_object('id', sticker_id, 'state', state, 'gold', gold))
                            from student_stickers where student_id = p_student and season = s.id), '[]'::json),
    -- čin: sličice vseh sezon, ki jih je učenec gradil s tem likom
    'ranks', coalesce((select json_object_agg(c.char_id, c.n) from (
                select sc.char_id, count(*) filter (where ss.state = 'have') as n
                  from student_season_char sc
                  left join student_stickers ss on ss.student_id = sc.student_id and ss.season = sc.season
                 where sc.student_id = p_student group by sc.char_id) c), '{}'::json),
    'chars', coalesce((select json_agg(distinct char_id) from student_season_char where student_id = p_student), '[]'::json),
    'items', coalesce((select json_agg(item_id) from student_items where student_id = p_student), '[]'::json),
    'avatar', (select json_build_object('form', form, 'skin', skin, 'hair', hair, 'eye', eye,
                       'style', style, 'active_char', active_char, 'equip', equip)
                 from student_avatar where student_id = p_student),
    -- napredek po predalih v sezoni (za obročke in "še vadiš")
    'tables', case when s.id is null then '[]'::json else coalesce((
                select json_agg(json_build_object('t', table_n, 'op', op,
                         'cover', cover, 'n', n, 'c', c, 'timed', tm, 'fast', f))
                  from (select table_n, op,
                               count(distinct factor) filter (where correct > 0) as cover,
                               sum(correct + wrong) as n, sum(correct) as c,
                               sum(timed) as tm, sum(fast) as f
                          from fact_stats
                         where student_id = p_student and day between s.starts and v_to
                         group by table_n, op) x), '[]'::json) end,
    'practice_days', case when s.id is null then 0 else
                (select count(*) from _album_practice_days(p_student, s.starts, v_to)) end,
    'streak', case when s.id is null then null else
                (select json_build_object('best', best, 'current', now_len)
                   from _album_streak(p_student, s.starts, v_to)) end,
    'comp', case when s.id is null then null else
                (select json_build_object('rounds', rounds, 'best', best, 'records', records, 'board', board)
                   from _album_comp(p_student, s.starts, v_to)) end,
    'battle', case when s.id is null then null else
                (select json_build_object('battles', battles, 'wins', wins, 'podiums', podiums, 'hosted', hosted, 'mates', mates)
                   from _album_battle(p_student, s.starts, v_to)) end
  );
end; $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 6. DEJANJA (kliče aplikacija)
-- ══════════════════════════════════════════════════════════════════════════

-- Konec tekmovanja (script.js, endCompetition): zapiše igro prijavljenega
-- učenca. Zavrne nemogoče: več kot 300 točk, več točk kot 3 × pravilni
-- (največji množilnik), več kot 150 odgovorov v 60 s, igro izven 7–20 h
-- po slovenskem času in več kot 40 iger na dan.
create or replace function public.add_comp_round(
  p_student uuid, p_score int, p_correct int, p_wrong int)
returns void language plpgsql security definer set search_path = public as $$
declare v_hour int := extract(hour from now() at time zone 'Europe/Ljubljana');
begin
  if not exists (select 1 from students where id = p_student) then return; end if;
  if p_score is null or p_correct is null or p_wrong is null
     or p_score < 0 or p_score > 300 or p_correct < 0 or p_wrong < 0
     or p_correct + p_wrong > 150 or p_score > 3 * p_correct then return; end if;
  -- odprto 7:00–19:00; igra, začeta ob 18:59, se konča po 19:00
  if (v_hour < 7 or v_hour >= 20)
     and coalesce(current_setting('album.vsaka_ura', true), '') <> 'da' then return; end if;
  if (select count(*) from comp_rounds
       where student_id = p_student and day = _album_today()) >= 40 then return; end if;
  insert into comp_rounds (student_id, day, score, correct, wrong)
  values (p_student, _album_today(), p_score, p_correct, p_wrong);
end; $$;

-- Prijavljen učenec po vstopu v bitko (battle.js, btEnter): "ta igralec sem
-- jaz". Velja le, če žeton res pripada igralcu te bitke (pozna ga samo
-- njegova naprava) in je ime igralca učenčevo uporabniško ime.
create or replace function public.battle_claim(p_code text, p_token uuid, p_student uuid)
returns void language sql security definer set search_path = public as $$
  update battle_players p set student_id = p_student
    from battles b
   where b.id = p.battle_id and b.code = trim(p_code) and p.token = p_token
     and exists (select 1 from students s where s.id = p_student and lower(s.username) = lower(p.name));
$$;

-- Ob odprtju albuma: preveri vse pogoje in nove sličice položi v ovojnico,
-- podeli zlate. Vrne stanje. Varno je klicati poljubnokrat.
create or replace function public.album_sync(p_student uuid)
returns json language plpgsql security definer set search_path = public as $$
declare s seasons; v_to date; v_char text; r record; ok boolean; st record; c record; bt record;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  s := _album_season_for(p_student);
  if s.id is null then return album_state(p_student); end if;
  v_to := least(_album_today(), s.ends);
  perform pg_advisory_xact_lock(hashtext('album:' || p_student::text));

  -- lik sezone (prvi obisk sezone)
  insert into student_season_char (student_id, season, char_id)
  values (p_student, s.id, s.char_id) on conflict do nothing;
  select char_id into v_char from student_season_char where student_id = p_student and season = s.id;

  -- brezplačni začetni predmeti za tega lika + skupni
  insert into student_items (student_id, item_id, source)
  select p_student, i.id, 'start' from items i
   where i.price = 0 and i.season <= s.id and (i.char_id is null or i.char_id = v_char)
  on conflict do nothing;

  -- videz: prvič ustvari, lik oblečen v začetno opremo
  insert into student_avatar (student_id, active_char) values (p_student, v_char) on conflict do nothing;
  update student_avatar a
     set equip = a.equip || jsonb_build_object(v_char, (
                   select coalesce(jsonb_object_agg(i.slot, i.id), '{}'::jsonb) from items i
                    where i.price = 0 and i.season <= s.id and (i.char_id is null or i.char_id = v_char))),
         active_char = coalesce(a.active_char, v_char)
   where a.student_id = p_student and not (a.equip ? v_char);

  select * into c from _album_comp(p_student, s.starts, v_to);
  select * into bt from _album_battle(p_student, s.starts, v_to);

  -- nove sličice → ovojnica
  for r in select * from album_stickers a
            where a.season = s.id
              and not exists (select 1 from student_stickers ss
                               where ss.student_id = p_student and ss.season = s.id and ss.sticker_id = a.id)
  loop
    ok := case r.kind
      when 'welcome' then true
      when 'table'   then _album_mastered(p_student, r.t, r.op, s.starts, v_to)
      when 'days'    then (select count(*) from _album_practice_days(p_student, s.starts, v_to)) >= r.n
      when 'streak'  then (select best from _album_streak(p_student, s.starts, v_to)) >= r.n
      when 'comp_first'   then c.rounds >= 1
      when 'comp_score'   then c.best >= r.n
      when 'comp_records' then c.records >= r.n
      when 'comp_board'   then c.board
      when 'battle_first'  then bt.battles >= 1
      when 'battle_count'  then bt.battles >= r.n
      when 'battle_podium' then bt.podiums >= 1
      when 'battle_mates'  then bt.mates >= r.n
      when 'battle_win'    then bt.wins >= 1
      when 'battle_host'   then bt.hosted >= 1
      else false end;
    if ok then
      insert into student_stickers (student_id, season, sticker_id) values (p_student, s.id, r.id)
      on conflict do nothing;
    end if;
  end loop;

  -- zlate: poštevanka, prilepljena pred vsaj 14 dnevi, obvladana tudi zdaj
  for st in select ss.sticker_id, a.t, a.op, ss.earned_at
              from student_stickers ss
              join album_stickers a on a.season = ss.season and a.id = ss.sticker_id
             where ss.student_id = p_student and ss.season = s.id
               and a.kind = 'table' and ss.state = 'have' and not ss.gold
               and (ss.earned_at at time zone 'Europe/Ljubljana')::date + 14 <= v_to
  loop
    if _album_gold(p_student, st.t, st.op,
                   (st.earned_at at time zone 'Europe/Ljubljana')::date + 14, v_to) then
      update student_stickers set gold = true, gold_at = now()
       where student_id = p_student and season = s.id and sticker_id = st.sticker_id;
      insert into coin_ledger (student_id, amount, reason, ref)
      values (p_student, 20, 'gold', s.id || ':' || st.sticker_id) on conflict do nothing;
    end if;
  end loop;

  return album_state(p_student);
end; $$;

-- Otrok prilepi sličico iz ovojnice: +20 cekinov. Če je stran s tem polna,
-- dobi nagrado strani (predmet, ki ni naprodaj). Vrne stanje + 'unlocked'.
create or replace function public.album_stick(p_student uuid, p_sticker text)
returns json language plpgsql security definer set search_path = public as $$
declare s seasons; v_page text; v_char text; v_item text;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  s := _album_season_for(p_student);
  if s.id is null then return album_state(p_student); end if;
  perform pg_advisory_xact_lock(hashtext('album:' || p_student::text));

  update student_stickers set state = 'have', stuck_at = now()
   where student_id = p_student and season = s.id and sticker_id = p_sticker and state = 'pending';
  if not found then return album_state(p_student); end if;

  insert into coin_ledger (student_id, amount, reason, ref)
  values (p_student, 20, 'sticker', s.id || ':' || p_sticker) on conflict do nothing;

  select page into v_page from album_stickers where season = s.id and id = p_sticker;
  select char_id into v_char from student_season_char where student_id = p_student and season = s.id;
  if not exists (select 1 from album_stickers a
                  where a.season = s.id and a.page = v_page
                    and not exists (select 1 from student_stickers ss
                                     where ss.student_id = p_student and ss.season = s.id
                                       and ss.sticker_id = a.id and ss.state = 'have')) then
    select i.id into v_item from items i
     where i.reward_season = s.id and i.reward_page = v_page
       and (i.char_id is null or i.char_id = v_char)
     limit 1;
    if v_item is not null then
      insert into student_items (student_id, item_id, source) values (p_student, v_item, 'reward')
      on conflict do nothing;
    end if;
  end if;

  return (album_state(p_student)::jsonb || jsonb_build_object('unlocked', v_item))::json;
end; $$;

-- Nakup. Cena in stanje cekinov sta samo tukaj. Vrne stanje + 'error':
--   null (uspelo), 'NI_NAPRODAJ', 'NI_ZA_TVOJ_LIK', 'ZE_IMAS', 'PREMALO'
create or replace function public.album_buy(p_student uuid, p_item text)
returns json language plpgsql security definer set search_path = public as $$
declare s seasons; it items; v_coins int; v_err text;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  perform pg_advisory_xact_lock(hashtext('album:' || p_student::text));
  s := _album_season_for(p_student);
  select * into it from items where id = p_item;

  if it.id is null or it.price is null or it.price = 0 or s.id is null or it.season > s.id then
    v_err := 'NI_NAPRODAJ';
  elsif it.char_id is not null and not exists (
          select 1 from student_season_char where student_id = p_student and char_id = it.char_id) then
    v_err := 'NI_ZA_TVOJ_LIK';
  elsif exists (select 1 from student_items where student_id = p_student and item_id = p_item) then
    v_err := 'ZE_IMAS';
  else
    select coalesce(sum(amount), 0) into v_coins from coin_ledger where student_id = p_student;
    if v_coins < it.price then
      v_err := 'PREMALO';
    else
      insert into student_items (student_id, item_id, source) values (p_student, p_item, 'buy');
      insert into coin_ledger (student_id, amount, reason, ref) values (p_student, -it.price, 'buy', p_item);
    end if;
  end if;

  return (album_state(p_student)::jsonb || jsonb_build_object('error', v_err))::json;
end; $$;

-- Shrani videz in oblečeno. Vse se preveri: barve, frizura, lik, in da je
-- vsak oblečen predmet res učenčev, za pravo režo in za pravega lika.
-- Neveljavni deli se tiho izpustijo. p_avatar: {form, skin, hair, eye, style,
-- active_char, equip: {lik: {reža: predmet}}}
create or replace function public.album_set_avatar(p_student uuid, p_avatar jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare v_equip jsonb := '{}'::jsonb; c record; e record; v_slots jsonb;
begin
  if not exists (select 1 from students where id = p_student) then return null; end if;
  insert into student_avatar (student_id) values (p_student) on conflict do nothing;

  for c in select key as ch, value as slots from jsonb_each(coalesce(p_avatar->'equip', '{}'::jsonb))
            where jsonb_typeof(value) = 'object'
              and exists (select 1 from student_season_char where student_id = p_student and char_id = key)
  loop
    v_slots := '{}'::jsonb;
    for e in select key as slot, value #>> '{}' as item from jsonb_each(c.slots) loop
      if exists (select 1 from items i join student_items si on si.item_id = i.id and si.student_id = p_student
                  where i.id = e.item and i.slot = e.slot and (i.char_id is null or i.char_id = c.ch)) then
        v_slots := v_slots || jsonb_build_object(e.slot, e.item);
      end if;
    end loop;
    v_equip := v_equip || jsonb_build_object(c.ch, v_slots);
  end loop;

  update student_avatar a set
    form  = case when p_avatar->>'form' in ('m', 'f') then p_avatar->>'form' else a.form end,
    skin  = case when p_avatar->>'skin' ~ '^#[0-9a-fA-F]{6}$' then p_avatar->>'skin' else a.skin end,
    hair  = case when p_avatar->>'hair' ~ '^#[0-9a-fA-F]{6}$' then p_avatar->>'hair' else a.hair end,
    eye   = case when p_avatar->>'eye'  ~ '^#[0-9a-fA-F]{6}$' then p_avatar->>'eye'  else a.eye  end,
    style = case when p_avatar->>'style' in ('kratki', 'dolgi', 'kitke', 'cop') then p_avatar->>'style' else a.style end,
    active_char = case when exists (select 1 from student_season_char
                                     where student_id = p_student and char_id = p_avatar->>'active_char')
                       then p_avatar->>'active_char' else a.active_char end,
    equip = a.equip || v_equip,
    updated_at = now()
  where a.student_id = p_student;

  return album_state(p_student);
end; $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 7. ZA UČITELJA (ročno v SQL Editorju)
-- ══════════════════════════════════════════════════════════════════════════

-- Preizkusni način (sezono vidijo samo izbrani učenci):
--   insert into album_testers (student_id)
--   select id from students where lower(username) in ('nik7a', 'lar4')
--   on conflict do nothing;
--
-- Začetek sezone za vse — najprej pobriši, kar so preizkuševalci nabrali
-- med preizkusom, da vsi začnejo enako:
--   delete from coin_ledger         where student_id in (select student_id from album_testers);
--   delete from student_stickers    where student_id in (select student_id from album_testers);
--   delete from student_items       where student_id in (select student_id from album_testers);
--   delete from student_season_char where student_id in (select student_id from album_testers);
--   delete from student_avatar      where student_id in (select student_id from album_testers);
--   delete from album_testers;
--   (igre v comp_rounds in bitke v battle_log ostanejo: v sezoni štejejo
--    samo tiste od začetka sezone)
--   update seasons set starts = current_date where id = 1;
--
-- Pregled — kdo ima koliko sličic in cekinov:
--   select s.username,
--          count(ss.*) filter (where ss.state = 'have') as sličic,
--          count(ss.*) filter (where ss.gold)           as zlatih,
--          (select coalesce(sum(amount), 0) from coin_ledger c where c.student_id = s.id) as cekinov
--     from students s left join student_stickers ss on ss.student_id = s.id
--    group by s.id, s.username order by sličic desc;
--
-- Preizkus pred začetkom (sezono za trenutek odpreš, nato zapreš in počistiš):
--   update seasons set starts = current_date where id = 1;
--   select album_sync('<id učenca>');
--   update seasons set starts = null where id = 1;
--   delete from coin_ledger; delete from student_stickers; delete from student_items;
--   delete from student_season_char; delete from student_avatar;
