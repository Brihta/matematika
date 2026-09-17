-- Brihta-MAT — razčlenitev odgovorov po načinu igre
--
-- ZAKAJ: učiteljski pregled je do zdaj štel samo, koliko odgovorov je učenec
-- oddal. Kviz je izbira med štirimi odgovori, zato ima ugibanje 25 % možnosti
-- — 300 odgovorov v kvizu ni isto kot 300 na tipkovnici ali v tekmovanju.
-- Brez načina tega iz podatkov ni mogoče videti.
--
-- Načina ni v `table_stats` (tam je samo poštevanka in operacija), je pa v
-- `stats`, kamor add_stats() zapisuje po načinu in dnevu. Ta funkcija tisto
-- tabelo samo prebere in sešteje.
--
-- Dodano POLEG obstoječih funkcij: get_class_overview se ne spreminja, zato
-- pregled deluje naprej tudi, če se tukaj karkoli zalomi. Dokler te funkcije
-- ni, aplikacija preprosto ne pokaže ikon načinov.
--
-- Zaženi v Supabase → SQL Editor.

-- ── Preveri najprej, kako se stolpci res imenujejo ────────────────────────
-- Če spodnja funkcija javi "column st.mode does not exist", poglej sem in
-- popravi imena v funkciji.
--
-- select column_name, data_type
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'stats'
--  order by ordinal_position;

-- ── Pregled po načinih ────────────────────────────────────────────────────
-- Podpis je namenoma enak kot pri get_class_overview: isti p_recent_since,
-- isti par stolpcev "_all" in "_recent". Tako lahko aplikacija obe funkciji
-- pokliče hkrati in si obdobje zapomni na isti način — "ves čas" bere
-- stolpce _all in ne potrebuje novega klica.
create or replace function public.get_class_modes(
  p_teacher_id uuid, p_recent_since date)
returns table(username text, mode text,
              correct_all bigint, wrong_all bigint,
              correct_recent bigint, wrong_recent bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Isti čuvaj kot drugod: brez veljavnega in potrjenega učiteljskega računa
  -- ni vrstic. Ključ v script.js je javen, zato mora pravilo biti tukaj.
  if not exists (
    select 1 from teachers t where t.id = p_teacher_id and t.approved
  ) then
    return;
  end if;

  return query
    select s.username,
           st.mode,
           sum(st.correct)::bigint,
           sum(st.wrong)::bigint,
           sum(case when st.day >= p_recent_since then st.correct else 0 end)::bigint,
           sum(case when st.day >= p_recent_since then st.wrong   else 0 end)::bigint
      from stats st
      join students s on s.id = st.student_id
     group by s.username, st.mode;
end; $$;

-- ── Hitri test ────────────────────────────────────────────────────────────
-- Vstavi svoj učiteljski id (select id, email from teachers) in poglej,
-- ali se števila ujemajo s tem, kar kaže pregled.
--
-- select * from public.get_class_modes(
--          'TVOJ-UCITELJSKI-ID'::uuid, current_date)
--  order by username, mode;
