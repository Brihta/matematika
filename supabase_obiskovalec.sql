-- Brihta-MAT — skupina »Obiskovalec«
--
-- ZAKAJ: Brihto igrajo tudi starši, stari starši, prijatelji in sorodniki.
-- Okno »V kateri razred hodiš?« jih je sililo, da si izberejo razred, zato so
-- se pomešali med učence (pregled za učiteljico, cilji razreda v albumu).
--
-- REŠITEV: nov stolpec students.obiskovalec. Obiskovalec nima razreda
-- (letnik in oddelek sta prazna), zato ga cilji razreda sami izpustijo.
-- Aplikaciji se predstavi z oznako 'OBISK' namesto razreda — po njej ve, da
-- ga ne sme več spraševati po razredu.
--
-- Zaženi v Supabase → SQL Editor. Varno za ponoven zagon.

-- ── 1. Nov stolpec ────────────────────────────────────────────────────────
alter table students add column if not exists obiskovalec boolean not null default false;

-- ── 2. Razred, ki ga vidi aplikacija ──────────────────────────────────────
-- Obiskovalec → 'OBISK'; sicer razred kot doslej.
create or replace function public.razred_ali_obisk(
  p_obiskovalec boolean, p_letnik smallint, p_oddelek text, d date)
returns text language sql immutable as $$
  select case when p_obiskovalec then 'OBISK'
              else public.razred_na_dan(p_letnik, p_oddelek, d) end;
$$;

create or replace function public.get_student_razred(p_student uuid)
returns text
language sql security definer set search_path = public
as $$
  select public.razred_ali_obisk(s.obiskovalec, s.letnik, s.oddelek, current_date)
    from students s where s.id = p_student;
$$;

create or replace function public.get_class_razreds(p_teacher_id uuid)
returns table(username text, razred text)
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from teachers where id = p_teacher_id) then return; end if;
  return query
    select s.username,
           public.razred_ali_obisk(s.obiskovalec, s.letnik, s.oddelek, current_date)
      from students s;
end; $$;

-- ── 3. Uporabnik sam izbere razred ali »sem samo na obisku« ───────────────
create or replace function public.set_student_razred(p_student uuid, p_razred text)
returns void
language plpgsql security definer set search_path = public
as $$
declare g int; o text;
begin
  if p_razred = 'OBISK' then
    update students set obiskovalec = true, letnik = null, oddelek = null
     where id = p_student;
    return;
  end if;
  if p_razred !~ '^[1-9][AB]$' then return; end if;
  g := (substring(p_razred from '^[1-9]'))::int;
  o := substring(p_razred from '[AB]$');
  update students
     set letnik      = (public.sola_leto(current_date) - g + 1)::smallint,
         oddelek     = o,
         obiskovalec = false
   where id = p_student;
end; $$;

-- ── 4. Učiteljica premakne račun v razred ali med obiskovalce ─────────────
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

  if p_razred = 'OBISK' then
    update students set obiskovalec = true, letnik = null, oddelek = null
     where lower(username) = lower(btrim(coalesce(p_username, '')));
    if not found then return 'NI_UCENCA'; end if;
    return 'OK';
  end if;

  if coalesce(p_razred, '') !~ '^[1-9][AB]$' then return 'SLAB_RAZRED'; end if;
  g := (substring(p_razred from '^[1-9]'))::int;
  o := substring(p_razred from '[AB]$');

  update students
     set letnik      = (public.sola_leto(current_date) - g + 1)::smallint,
         oddelek     = o,
         obiskovalec = false
   where lower(username) = lower(btrim(coalesce(p_username, '')));

  if not found then return 'NI_UCENCA'; end if;
  return 'OK';
end; $$;
