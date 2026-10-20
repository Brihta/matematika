-- Brihta-MAT — seštevanje in odštevanje do 20
--
-- ZAKAJ: učiteljica 3. razreda je predlagala, da bi otroci poleg poštevanke
-- na enak način utrjevali račune do 20. Hiter priklic (7 + 3, 8 + 5, 14 − 6)
-- je osnova za vse nadaljnje računanje in za teste, kjer je čas omejen.
--
-- KAJ SE BELEŽI: za vsako skupino računov in operacijo na dan — pravilni,
-- napačni, koliko pravilnih je bilo časovno izmerjenih in koliko od njih
-- hitrejših od 3 s (prag je v script.js, FAST_SECONDS). Tudi kviz.
--
-- SKUPINE (grp) — kot pri pouku, pravila so v script.js (do20Group):
--   d10  do 10                4 + 3,  7 + 3, 10 − 4
--   b20  do 20 brez prehoda   13 + 4, 17 − 4, 10 + 10
--   pr   do 20 s prehodom     8 + 5,  6 + 6, 14 − 6
-- Do 20. 10. 2026 sta bili še skupini p10 (prijatelji 10) in dv (dvojčki);
-- ponoven zagon te datoteke jih prestavi (glej "Prehod" spodaj).
-- op: 'p' = seštevanje (plus), 'm' = odštevanje (minus)
--
-- Vse je dodano POLEG obstoječega. Odgovori Do 20 namenoma NE gredo v
-- `stats`: iz nje se računajo stolpec Odgovori, nizi v albumu in cekini, ki
-- so za poštevanko. Dokler te datoteke ne zaženeš, aplikacija deluje kot
-- prej, le Do 20 se nikamor ne zapiše.
--
-- Zaženi v Supabase → SQL Editor (celo datoteko naenkrat).

-- ── 1. Tabela ─────────────────────────────────────────────────────────────
create table if not exists do20_stats (
  student_id uuid     not null references students(id) on delete cascade,
  day        date     not null,
  grp        text     not null check (grp in ('d10', 'b20', 'pr')),
  op         text     not null check (op in ('p', 'm')),
  correct    int      not null default 0,
  wrong      int      not null default 0,
  timed      int      not null default 0,   -- pravilni, časovno izmerjeni
  fast       int      not null default 0,   -- od tega hitrejši od praga
  primary key (student_id, day, grp, op)
);
-- RLS brez politik = z javnim ključem ni neposrednega dostopa. Pišejo in
-- berejo samo funkcije spodaj (SECURITY DEFINER), tako kot pri fact_stats.
alter table do20_stats enable row level security;

-- Prehod (20. 10. 2026): p10 → d10. Dvojčkov se brez posameznih računov ne
-- da razdeliti (3 + 3 je do 10, 7 + 7 s prehodom), zato gredo k prehodu,
-- kamor spada večina. Po posameznih računih (do20_facts, mejniki) se
-- razvrstijo natančno, glej supabase_ljubljencek.sql.
alter table do20_stats drop constraint if exists do20_stats_grp_check;
insert into do20_stats (student_id, day, grp, op, correct, wrong, timed, fast)
select student_id, day, case grp when 'p10' then 'd10' else 'pr' end, op,
       sum(correct), sum(wrong), sum(timed), sum(fast)
  from do20_stats where grp in ('p10', 'dv')
 group by student_id, day, case grp when 'p10' then 'd10' else 'pr' end, op
on conflict (student_id, day, grp, op) do update
   set correct = do20_stats.correct + excluded.correct,
       wrong   = do20_stats.wrong   + excluded.wrong,
       timed   = do20_stats.timed   + excluded.timed,
       fast    = do20_stats.fast    + excluded.fast;
delete from do20_stats where grp in ('p10', 'dv');
alter table do20_stats add constraint do20_stats_grp_check check (grp in ('d10', 'b20', 'pr'));

-- ── 2. Učenec zapiše ──────────────────────────────────────────────────────
-- p_data: [{"g":"pr","op":"p","c":3,"w":1,"n":3,"f":2}, ...]
-- Vrednosti so omejene na 0–500 na klic, tako kot pri add_fact_stats.
-- Stara aplikacija (pred 20. 10. 2026) še pošilja p10 in dv: prestavimo ju
-- kot pri prehodu zgoraj in seštejemo po skupini, da ena vrstica ne pride
-- dvakrat v isti insert.
create or replace function public.add_do20_stats(
  p_student uuid, p_day date, p_data jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from students where id = p_student) then return; end if;

  insert into do20_stats (student_id, day, grp, op, correct, wrong, timed, fast)
  select p_student, p_day, g, op, least(500, sum(c)), least(500, sum(w)), least(500, sum(n)), least(500, sum(f))
    from (select case e->>'g' when 'p10' then 'd10' when 'dv' then 'pr' else e->>'g' end g, e->>'op' op,
                 greatest(0, least(500, coalesce((e->>'c')::int, 0))) c,
                 greatest(0, least(500, coalesce((e->>'w')::int, 0))) w,
                 greatest(0, least(500, coalesce((e->>'n')::int, 0))) n,
                 greatest(0, least(500, coalesce((e->>'f')::int, 0))) f
            from jsonb_array_elements(coalesce(p_data, '[]'::jsonb)) e
           where e->>'g' in ('d10', 'p10', 'dv', 'b20', 'pr')
             and e->>'op' in ('p', 'm')) t
   group by g, op
  on conflict (student_id, day, grp, op) do update
     set correct = do20_stats.correct + excluded.correct,
         wrong   = do20_stats.wrong   + excluded.wrong,
         timed   = do20_stats.timed   + excluded.timed,
         fast    = do20_stats.fast    + excluded.fast;
end; $$;

-- ── 3. Učenec prebere svoje ───────────────────────────────────────────────
-- Po dnevih, da aplikacija sama loči "zadnja 2 tedna" od "ves čas".
create or replace function public.get_my_do20(p_student uuid)
returns table(day date, grp text, op text,
              correct int, wrong int, timed int, fast int)
language sql security definer set search_path = public
as $$
  select day, grp, op, correct, wrong, timed, fast
    from do20_stats where student_id = p_student;
$$;

-- ── 4. Učitelj prebere razred ─────────────────────────────────────────────
-- Podpis kot pri get_class_speed: isti par _all / _recent, samo potrjen učitelj.
create or replace function public.get_class_do20(
  p_teacher_id uuid, p_recent_since date)
returns table(username text, grp text, op text,
              correct_all bigint, wrong_all bigint,
              correct_recent bigint, wrong_recent bigint,
              timed_all bigint, fast_all bigint,
              timed_recent bigint, fast_recent bigint)
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from teachers t where t.id = p_teacher_id and t.approved
  ) then
    return;
  end if;

  return query
    select s.username, d.grp, d.op,
           sum(d.correct)::bigint,
           sum(d.wrong)::bigint,
           sum(case when d.day >= p_recent_since then d.correct else 0 end)::bigint,
           sum(case when d.day >= p_recent_since then d.wrong   else 0 end)::bigint,
           sum(d.timed)::bigint,
           sum(d.fast)::bigint,
           sum(case when d.day >= p_recent_since then d.timed else 0 end)::bigint,
           sum(case when d.day >= p_recent_since then d.fast  else 0 end)::bigint
      from do20_stats d
      join students s on s.id = d.student_id
     group by s.username, d.grp, d.op;
end; $$;

-- ── 5. Združevanje računov učencev ────────────────────────────────────────
-- Ista funkcija kot v supabase_racuni.sql, z dodanim blokom za do20_stats.
-- Brez njega bi se ob združitvi vadba Do 20 starega računa izgubila.
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

-- Brisanje učenca (delete_student) ne potrebuje sprememb: do20_stats ima
-- "on delete cascade", zato vrstice izginejo skupaj z računom.

-- ── Hitri test ────────────────────────────────────────────────────────────
-- Po nekaj odgovorih v Do 20:
--
-- select s.username, d.*
--   from do20_stats d join students s on s.id = d.student_id
--  order by d.day desc, s.username, d.grp, d.op
--  limit 50;
