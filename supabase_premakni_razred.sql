-- Brihta-MAT — učitelj premakne učenca v drug razred
--
-- ZAKAJ: otrok ob prvi prijavi sam izbere razred in včasih izbere napačnega
-- (ali se med letom prepiše v drug oddelek). Do zdaj se je to dalo popraviti
-- samo v SQL-u.
--
-- Razred se shrani enako kot pri učencu (supabase_generacije.sql): iz
-- razreda, v katerem je otrok DANES, se izračuna letnik vpisa. Ker se razred
-- za pretekle dni računa iz letnika, se s premikom spremeni tudi zgodovina —
-- za popravek napačne izbire je to prav tako, kot mora biti.
--
-- Zaščita: samo veljaven ID potrjenega učitelja.
--
-- Zaženi v Supabase → SQL Editor.

create or replace function public.move_student_razred(
  p_teacher_id uuid, p_username text, p_razred text)
returns text
language plpgsql security definer set search_path = public
as $$
declare g int; o text;
begin
  if not exists (
    select 1 from teachers where id = p_teacher_id and approved
  ) then
    return 'NI_DOVOLJENJA';
  end if;

  if coalesce(p_razred, '') !~ '^[1-9][AB]$' then return 'SLAB_RAZRED'; end if;
  g := (substring(p_razred from '^[1-9]'))::int;
  o := substring(p_razred from '[AB]$');

  update students
     set letnik  = (public.sola_leto(current_date) - g + 1)::smallint,
         oddelek = o
   where lower(username) = lower(btrim(coalesce(p_username, '')));

  if not found then return 'NI_UCENCA'; end if;
  return 'OK';
end; $$;
