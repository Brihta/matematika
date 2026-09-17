-- Brihta-MAT — učitelj lahko popravi ime učenca
--
-- ZAKAJ: otroci se ob registraciji vpišejo kot 'nac', 'BRIN', 'vas'.
-- Okrajšave zna razvozlati samo učitelj, ki otroka pozna, popravljati pa jih
-- v bazi za vsakim posebej ni vzdržno — vsak september pride nov razred.
--
-- Zaščita je enaka kot pri ponastavitvi gesla: kliče se lahko samo z
-- veljavnim ID-jem potrjenega učitelja, ki ga aplikacija dobi ob prijavi.
--
-- Zaženi v Supabase → SQL Editor.

create or replace function public.set_student_name(
  p_teacher_id uuid, p_username text, p_name text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_name text;
begin
  if not exists (
    select 1 from teachers
     where id = p_teacher_id and approved
  ) then
    return 'NI_DOVOLJENJA';
  end if;

  v_name := btrim(coalesce(p_name, ''));
  if length(v_name) < 1 or length(v_name) > 30 then
    return 'SLABO_IME';
  end if;

  update students
     set display_name = v_name
   where lower(username) = lower(btrim(coalesce(p_username, '')));

  if not found then
    return 'NI_UCENCA';
  end if;

  return 'OK';
end; $$;

-- ── Enkraten popravek velikih začetnic ────────────────────────────────────
-- Najprej poglej, kaj bi se spremenilo:
--
-- select display_name as zdaj,
--        upper(left(display_name,1)) || lower(substr(display_name,2)) as popravljeno
--   from students
--  where display_name is not null
--    and display_name <> upper(left(display_name,1)) || lower(substr(display_name,2))
--  order by 1;
--
-- Nato uveljavi:
--
-- update students
--    set display_name = upper(left(display_name,1)) || lower(substr(display_name,2))
--  where display_name is not null;
