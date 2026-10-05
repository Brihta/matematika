-- Brihta-MAT — vadba po posameznih računih (7·1 … 7·10)
--
-- ZAKAJ: Brihtometer je doslej štel predal (npr. 7 ×) za obvladan že po 5
-- odgovorih. Otrok je tako videl največ pol predala in je lahko dobil
-- "obvladano", ne da bi kdaj rešil 7·8. Novo pravilo (odločeno 5. 10. 2026)
-- zahteva, da so vsi računi predala vsaj enkrat pravilni. Tega iz table_stats
-- ni mogoče ugotoviti: tam je samo seštevek po poštevanki in operaciji.
--
-- KAJ SE BELEŽI: za vsak račun na dan — pravilni, napačni, koliko pravilnih
-- je bilo časovno izmerjenih in koliko od njih hitrejših od 3 s (prag je v
-- script.js, FAST_SECONDS). Samo odgovori s TIPKOVNICE, TEKMOVANJA in BITKE:
-- v kvizu lahko otrok odgovor ugane med štirimi, zato za obvladanje ne šteje.
--
-- RAČUN (stolpec factor) je število, ki ga poštevanka množi:
--   množenje  3 × 7  → poštevanka 7, račun 3
--   deljenje 21 : 7  → poštevanka 7, račun 3 (količnik)
-- Tako ima vsak predal natanko 10 računov, 1–10, za × in za ÷ enako.
--
-- Vse je dodano POLEG obstoječega: table_stats, table_speed in Brihtometer se
-- ne spreminjajo. Dokler te datoteke ne zaženeš, aplikacija deluje kot prej:
-- klic add_fact_stats tiho spodleti. Ko jo zaženeš, se podatki začnejo
-- zbirati — novo pravilo Brihtometra jih bo bralo pozneje.
--
-- Zaženi v Supabase → SQL Editor (celo datoteko naenkrat).

-- ── 1. Tabela ─────────────────────────────────────────────────────────────
create table if not exists fact_stats (
  student_id uuid     not null references students(id) on delete cascade,
  day        date     not null,
  table_n    smallint not null check (table_n between 1 and 10),
  op         text     not null check (op in ('x', 'd')),
  factor     smallint not null check (factor between 1 and 10),
  correct    int      not null default 0,
  wrong      int      not null default 0,
  timed      int      not null default 0,   -- pravilni, časovno izmerjeni
  fast       int      not null default 0,   -- od tega hitrejši od praga
  primary key (student_id, day, table_n, op, factor)
);
-- RLS brez politik = z javnim ključem ni neposrednega dostopa. Pišejo in
-- berejo samo funkcije spodaj (SECURITY DEFINER), tako kot pri table_speed.
alter table fact_stats enable row level security;

-- ── 2. Učenec zapiše ──────────────────────────────────────────────────────
-- p_data: [{"t":7,"op":"x","k":3,"c":1,"w":0,"n":1,"f":1}, ...]
--   t = poštevanka, k = račun, c/w = pravilni/napačni, n/f = izmerjeni/hitri
-- Vrednosti so omejene na 0–500 na klic, tako kot pri add_table_speed.
create or replace function public.add_fact_stats(
  p_student uuid, p_day date, p_data jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from students where id = p_student) then return; end if;

  insert into fact_stats (student_id, day, table_n, op, factor, correct, wrong, timed, fast)
  select p_student, p_day,
         (e->>'t')::smallint, e->>'op', (e->>'k')::smallint,
         greatest(0, least(500, coalesce((e->>'c')::int, 0))),
         greatest(0, least(500, coalesce((e->>'w')::int, 0))),
         greatest(0, least(500, coalesce((e->>'n')::int, 0))),
         greatest(0, least(500, coalesce((e->>'f')::int, 0)))
    from jsonb_array_elements(coalesce(p_data, '[]'::jsonb)) e
   where (e->>'t') ~ '^([1-9]|10)$'
     and (e->>'k') ~ '^([1-9]|10)$'
     and e->>'op' in ('x', 'd')
  on conflict (student_id, day, table_n, op, factor) do update
     set correct = fact_stats.correct + excluded.correct,
         wrong   = fact_stats.wrong   + excluded.wrong,
         timed   = fact_stats.timed   + excluded.timed,
         fast    = fact_stats.fast    + excluded.fast;
end; $$;

-- ── 3. Učenec prebere svoje ───────────────────────────────────────────────
-- p_since: od katerega dne naprej (začetek sezone); null = ves čas.
-- Vrne seštevek po računu, ne po dnevih — to rabi pravilo obvladanja.
create or replace function public.get_my_facts(p_student uuid, p_since date default null)
returns table(table_n smallint, op text, factor smallint,
              correct bigint, wrong bigint, timed bigint, fast bigint)
language sql security definer set search_path = public
as $$
  select f.table_n, f.op, f.factor,
         sum(f.correct)::bigint, sum(f.wrong)::bigint,
         sum(f.timed)::bigint,   sum(f.fast)::bigint
    from fact_stats f
   where f.student_id = p_student
     and (p_since is null or f.day >= p_since)
   group by f.table_n, f.op, f.factor;
$$;

-- ── 4. Učitelj prebere razred ─────────────────────────────────────────────
-- Zaščita kot pri get_class_speed: samo potrjen učitelj.
create or replace function public.get_class_facts(
  p_teacher_id uuid, p_since date default null)
returns table(username text, table_n smallint, op text, factor smallint,
              correct bigint, wrong bigint, timed bigint, fast bigint)
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from teachers t where t.id = p_teacher_id and t.approved
  ) then
    return;
  end if;

  return query
    select s.username, f.table_n, f.op, f.factor,
           sum(f.correct)::bigint, sum(f.wrong)::bigint,
           sum(f.timed)::bigint,   sum(f.fast)::bigint
      from fact_stats f
      join students s on s.id = f.student_id
     where p_since is null or f.day >= p_since
     group by s.username, f.table_n, f.op, f.factor;
end; $$;

-- ── 5. Združevanje računov učencev ────────────────────────────────────────
-- merge_students (supabase_zdruzi_izbrisi.sql) prenese vadbo iz starega
-- računa v novega. Brez tega bloka bi se računi starega računa ob združitvi
-- izgubili (izbrisani skupaj z računom, on delete cascade).
-- Spodaj je ista funkcija kot tam, z dodanim blokom za fact_stats.
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

-- Brisanje učenca (delete_student) ne potrebuje sprememb: fact_stats ima
-- "on delete cascade", zato vrstice izginejo skupaj z računom.

-- ── Hitri test ────────────────────────────────────────────────────────────
-- Po nekaj odgovorih na TIPKOVNICI (kviz se ne beleži):
--
-- select s.username, f.*
--   from fact_stats f join students s on s.id = f.student_id
--  order by f.day desc, s.username, f.table_n, f.op, f.factor
--  limit 50;
