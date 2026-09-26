-- Brihta-MAT — hitrost odgovorov: "obvlada" pomeni pravilno IN hitro
--
-- ZAKAJ: cilj poštevanke je priklic na pamet, ne računanje na prste. Otrok,
-- ki 7 · 8 vsakič pravilno izračuna v desetih sekundah, je natančen, a
-- poštevanke še ne zna. Brihtometer ga je doslej štel za obvladanega.
--
-- KAJ SE BELEŽI: za vsak predal (poštevanka × operacija) na dan dve števili —
-- koliko pravilnih odgovorov je bilo časovno izmerjenih in koliko od njih je
-- bilo hitrejših od 3 s. Prag je v script.js (FAST_SECONDS), ne tukaj.
--
-- Vse je dodano POLEG obstoječega: table_stats, add_table_stats in
-- get_class_overview se ne spreminjajo. Dokler te datoteke ne zaženeš,
-- aplikacija deluje kot prej in hitrosti preprosto ne upošteva.
--
-- Stari podatki nimajo časa, zato zanje velja staro pravilo (samo točnost).
-- Hitrost začne šteti, ko ima predal vsaj 5 izmerjenih pravilnih odgovorov.
--
-- Zaženi v Supabase → SQL Editor.

-- ── 1. Tabela ─────────────────────────────────────────────────────────────
create table if not exists table_speed (
  student_id uuid     not null references students(id) on delete cascade,
  day        date     not null,
  table_n    smallint not null check (table_n between 1 and 10),
  op         text     not null check (op in ('x', 'd')),
  timed      int      not null default 0,   -- pravilni, časovno izmerjeni
  fast       int      not null default 0,   -- od tega hitrejši od praga
  primary key (student_id, day, table_n, op)
);
-- RLS brez politik = z javnim ključem ni neposrednega dostopa. Pišejo in
-- berejo samo funkcije spodaj (SECURITY DEFINER).
alter table table_speed enable row level security;

-- ── 2. Učenec zapiše ──────────────────────────────────────────────────────
-- p_data: [{"t":7,"op":"x","n":4,"f":3}, ...] — enako kot pri add_table_stats.
create or replace function public.add_table_speed(
  p_student uuid, p_day date, p_data jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from students where id = p_student) then return; end if;

  insert into table_speed (student_id, day, table_n, op, timed, fast)
  select p_student, p_day,
         (e->>'t')::smallint, e->>'op',
         greatest(0, least(500, coalesce((e->>'n')::int, 0))),
         greatest(0, least(500, coalesce((e->>'f')::int, 0)))
    from jsonb_array_elements(coalesce(p_data, '[]'::jsonb)) e
   where (e->>'t') ~ '^([1-9]|10)$' and e->>'op' in ('x', 'd')
  on conflict (student_id, day, table_n, op) do update
     set timed = table_speed.timed + excluded.timed,
         fast  = table_speed.fast  + excluded.fast;
end; $$;

-- ── 3. Učenec prebere svoje ───────────────────────────────────────────────
create or replace function public.get_my_speed(p_student uuid)
returns table(day date, table_n smallint, op text, timed int, fast int)
language sql security definer set search_path = public
as $$
  select day, table_n, op, timed, fast
    from table_speed where student_id = p_student;
$$;

-- ── 4. Učitelj prebere razred ─────────────────────────────────────────────
-- Podpis je namenoma enak kot pri get_class_overview in get_class_modes,
-- da jih aplikacija pokliče hkrati in uporabi isti par _all / _recent.
create or replace function public.get_class_speed(
  p_teacher_id uuid, p_recent_since date)
returns table(username text, table_n smallint, op text,
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
    select s.username, sp.table_n, sp.op,
           sum(sp.timed)::bigint,
           sum(sp.fast)::bigint,
           sum(case when sp.day >= p_recent_since then sp.timed else 0 end)::bigint,
           sum(case when sp.day >= p_recent_since then sp.fast  else 0 end)::bigint
      from table_speed sp
      join students s on s.id = sp.student_id
     group by s.username, sp.table_n, sp.op;
end; $$;

-- ── Hitri test ────────────────────────────────────────────────────────────
-- Po nekaj odgovorih v aplikaciji:
--
-- select s.username, sp.* from table_speed sp join students s on s.id = sp.student_id
--  order by sp.day desc, s.username, sp.table_n, sp.op limit 50;
