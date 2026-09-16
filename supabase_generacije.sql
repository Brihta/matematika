-- Brihta-MAT — razred se računa iz generacije, ne shranjuje kot besedilo
--
-- TEŽAVA: razred je bil shranjen kot '3A'. Čez poletje so vsi napredovali,
-- podatek pa je ostal enak. Če bi ga vsako leto samo prepisali, bi z novo
-- oznako prelepili tudi vse lanske rezultate — in vprašanje "kako je bil
-- lanski 4A v primerjavi z letošnjim" ne bi bilo več odgovorljivo.
--
-- REŠITEV: shranimo letnik vpisa v 1. razred in oddelek (A/B). Razred se
-- vedno izračuna iz datuma, zato vsako poletje napredujejo sami. Ker se da
-- izračunati za katerikoli dan, ostane zgodovina neokrnjena.
--
-- Zaženi v Supabase → SQL Editor.

-- ── 1. Nova stolpca ───────────────────────────────────────────────────────
alter table students add column if not exists letnik  smallint;
alter table students add column if not exists oddelek text;

-- ── 2. Kateremu šolskemu letu pripada datum ───────────────────────────────
-- Šolsko leto se začne 1. septembra: 15. 5. 2026 spada v leto 2025/26,
-- zato vrne 2025. 16. 9. 2026 spada v 2026/27, zato vrne 2026.
create or replace function public.sola_leto(d date)
returns int language sql immutable as $$
  select case when extract(month from d) >= 9
              then extract(year from d)::int
              else extract(year from d)::int - 1
         end;
$$;

-- ── 3. Kateri razred je bil učenec na določen dan ─────────────────────────
-- Vrne NULL pred 1. razredom in po 9. — torej tudi za tiste, ki so že končali.
create or replace function public.razred_na_dan(
  p_letnik smallint, p_oddelek text, d date)
returns text language sql immutable as $$
  select case
    when p_letnik is null or p_oddelek is null then null
    when (public.sola_leto(d) - p_letnik + 1) between 1 and 9
      then (public.sola_leto(d) - p_letnik + 1)::text || p_oddelek
    else null
  end;
$$;

-- ── 4. Prenos obstoječih podatkov ─────────────────────────────────────────
-- POMEMBNO: obstoječi razredi so bili vpisani v šolskem letu 2025/26, zato
-- računamo glede na 2025. Učenec, ki je vpisan kot '3A', je bil torej v
-- 1. razredu leta 2023/24 — in je danes (2026/27) v 4A.
update students
   set letnik  = (2025 - (substring(razred from '^[1-9]'))::int + 1)::smallint,
       oddelek = substring(razred from '[AB]$')
 where razred ~ '^[1-9][AB]$'
   and letnik is null;

-- ── 5. Funkcije, ki jih uporablja aplikacija ──────────────────────────────
-- Podpisi ostajajo enaki kot prej, zato jih ni treba brisati.

create or replace function public.get_student_razred(p_student uuid)
returns text
language sql security definer set search_path = public
as $$
  select public.razred_na_dan(s.letnik, s.oddelek, current_date)
    from students s where s.id = p_student;
$$;

-- Učenec izbere razred, v katerem JE DANES; iz tega izračunamo njegov letnik.
create or replace function public.set_student_razred(p_student uuid, p_razred text)
returns void
language plpgsql security definer set search_path = public
as $$
declare g int; o text;
begin
  if p_razred !~ '^[1-9][AB]$' then return; end if;
  g := (substring(p_razred from '^[1-9]'))::int;
  o := substring(p_razred from '[AB]$');
  update students
     set letnik  = (public.sola_leto(current_date) - g + 1)::smallint,
         oddelek = o
   where id = p_student;
end; $$;

create or replace function public.get_class_razreds(p_teacher_id uuid)
returns table(username text, razred text)
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from teachers where id = p_teacher_id) then return; end if;
  return query
    select s.username,
           public.razred_na_dan(s.letnik, s.oddelek, current_date)
      from students s;
end; $$;

-- ── 6. Preveri, ali je prenos pravilen ────────────────────────────────────
-- Stolpec "danes" mora biti za eno stopnjo višji od "stari_zapis".
--
-- select razred as stari_zapis, letnik, oddelek,
--        public.razred_na_dan(letnik, oddelek, current_date) as danes,
--        count(*)
--   from students
--  group by 1,2,3,4
--  order by letnik, oddelek;
--
-- Kdo je končal šolo (danes je NULL, letnik pa vpisan):
--
-- select username, letnik, oddelek from students
--  where letnik is not null
--    and public.razred_na_dan(letnik, oddelek, current_date) is null;

-- ── 7. Za medgeneracijsko primerjavo (pozneje) ────────────────────────────
-- Ker je razred izračunljiv za katerikoli dan, se da vprašati tudi to:
-- "kako so se odrezali vsi četrtošolci, ne glede na leto":
--
-- select public.sola_leto(st.day) as solsko_leto,
--        sum(st.correct) as pravilni, sum(st.wrong) as napacni
--   from stats st join students s on s.id = st.student_id
--  where public.razred_na_dan(s.letnik, s.oddelek, st.day) like '4%'
--  group by 1 order by 1;
--
-- Stari stolpec students.razred pušča pri miru kot zapis prve izbire.
-- Aplikacija ga ne bere več.
