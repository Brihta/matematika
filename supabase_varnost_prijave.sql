-- Brihta-MAT — varnejša prijava učencev
--
-- ZAKAJ: učenci so začeli ugibati gesla sošolcev. Uporabniška imena so javna
-- (dvorana slavnih, bitke), veliko otrok pa ima za geslo 4 enake živali —
-- takih gesel je samo 12. Napačnih poskusov je bilo lahko neomejeno.
--
-- KAJ NAREDI:
--   1. Po 5 napačnih poskusih v 10 minutah se račun za 10 minut zaklene.
--      Pravilna prijava števec pobriše. Učitelj ga ne vidi in ne rabi
--      odklepati: zaklep sam poteče.
--   2. Učenec si lahko sam spremeni geslo (v okencu s profilom). Rabi staro
--      geslo, da ga ne more spremeniti sošolec na pozabljeni prijavi.
--
-- KAKO: login_student v repozitoriju ni zapisan, zato ga ta datoteka ne
-- prepisuje. Obstoječo funkcijo preimenuje v login_student_preveri (z javnim
-- ključem je ni več mogoče klicati) in pod starim imenom postavi ovoj, ki
-- šteje poskuse in kliče preveri. Aplikacija kliče isto kot prej.
--
-- Zaženi v Supabase → SQL Editor (celo datoteko naenkrat). Varno za ponoven
-- zagon.

-- ── 0. Preverjanje ────────────────────────────────────────────────────────
-- Sprememba gesla piše v students.pin_hash. Če stolpec ni tak, se ustavi,
-- preden kar koli spremeni, in izpiše, kateri stolpci so.
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'students'
                    and column_name = 'pin_hash') then
    raise exception 'students nima stolpca pin_hash. Stolpci: %',
      (select string_agg(column_name, ', ') from information_schema.columns
        where table_schema = 'public' and table_name = 'students');
  end if;
end $$;

-- ── 1. Števec napačnih poskusov ───────────────────────────────────────────
-- uname = uporabniško ime z malimi črkami. Šteje tudi imena, ki ne obstajajo,
-- da zaklep ne izda, katero ime obstaja.
create table if not exists login_attempts (
  uname        text primary key,
  fails        int  not null default 0,
  first_fail   timestamptz,
  locked_until timestamptz
);
-- RLS brez politik = z javnim ključem ni neposrednega dostopa.
alter table login_attempts enable row level security;

create or replace function public._login_locked_until(p_uname text)
returns timestamptz
language sql stable security definer set search_path = public
as $$
  select locked_until from login_attempts
   where uname = p_uname and locked_until > now();
$$;

create or replace function public._login_fail(p_uname text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into login_attempts (uname, fails, first_fail)
  values (p_uname, 1, now())
  on conflict (uname) do update
     set fails = case when coalesce(login_attempts.first_fail, '-infinity') < now() - interval '10 minutes'
                      then 1 else login_attempts.fails + 1 end,
         first_fail = case when coalesce(login_attempts.first_fail, '-infinity') < now() - interval '10 minutes'
                      then now() else login_attempts.first_fail end;
  update login_attempts
     set locked_until = now() + interval '10 minutes', fails = 0, first_fail = null
   where uname = p_uname and fails >= 5;
end; $$;

revoke execute on function public._login_locked_until(text) from public, anon, authenticated;
revoke execute on function public._login_fail(text)         from public, anon, authenticated;

-- ── 2. Ovoj okoli obstoječe prijave ───────────────────────────────────────
-- Vrne točno iste stolpce kot stara funkcija (prebere jih iz baze), zato
-- aplikacija ne opazi razlike. Zaklenjen račun vrne prazno, kot napačno geslo.
do $$
declare v_res text;
begin
  if to_regprocedure('public.login_student_preveri(text, text)') is null then
    alter function public.login_student(text, text) rename to login_student_preveri;
  end if;
  revoke execute on function public.login_student_preveri(text, text) from public, anon, authenticated;

  v_res := pg_get_function_result('public.login_student_preveri(text, text)'::regprocedure);
  drop function if exists public.login_student(text, text);
  execute format($f$
    create function public.login_student(p_username text, p_pin text)
    returns %s
    language plpgsql security definer set search_path = public
    as $body$
    #variable_conflict use_column
    declare v_u text := lower(btrim(coalesce(p_username, '')));
    begin
      if public._login_locked_until(v_u) is not null then return; end if;
      return query select * from public.login_student_preveri(p_username, p_pin);
      if found then
        delete from login_attempts where uname = v_u;
      else
        perform public._login_fail(v_u);
      end if;
    end $body$ $f$, v_res);
  grant execute on function public.login_student(text, text) to anon, authenticated;
end $$;

-- ── 3. Koliko minut je račun še zaklenjen ─────────────────────────────────
-- Aplikacija vpraša po neuspeli prijavi, da otroku pove, naj počaka.
-- 0 = ni zaklenjen.
create or replace function public.login_locked_minutes(p_username text)
returns int
language sql stable security definer set search_path = public
as $$
  select coalesce(ceil(extract(epoch from
           public._login_locked_until(lower(btrim(coalesce(p_username, '')))) - now()) / 60)::int, 0);
$$;
grant execute on function public.login_locked_minutes(text) to anon, authenticated;

-- ── 4. Učenec si sam spremeni geslo ───────────────────────────────────────
-- Geslo je 4 živali: indeksi 0–11, ločeni z vejico (kot pri prijavi).
-- Vrne OK, BAD_LOGIN (staro geslo napačno), ZAKLENJENO ali SLABO_GESLO.
-- Napačno staro geslo šteje med poskuse, sicer bi se tu dalo ugibati brez meje.
create or replace function public.change_student_pin(
  p_username text, p_old text, p_new text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_u  text := lower(btrim(coalesce(p_username, '')));
  v_id uuid;
begin
  if coalesce(p_new, '') !~ '^([0-9]|1[01]),([0-9]|1[01]),([0-9]|1[01]),([0-9]|1[01])$' then
    return 'SLABO_GESLO';
  end if;
  if public._login_locked_until(v_u) is not null then return 'ZAKLENJENO'; end if;

  select p.id into v_id from public.login_student_preveri(p_username, p_old) p limit 1;
  if v_id is null then
    perform public._login_fail(v_u);
    return 'BAD_LOGIN';
  end if;

  update students set pin_hash = crypt(p_new, gen_salt('bf')) where id = v_id;
  -- Varovalka: z novim geslom se mora dati prijaviti, sicer vse prekliči.
  if not exists (select 1 from public.login_student_preveri(p_username, p_new)) then
    raise exception 'Novo geslo se ne ujema s prijavo — nič ni spremenjeno.';
  end if;
  delete from login_attempts where uname = v_u;
  return 'OK';
end; $$;
grant execute on function public.change_student_pin(text, text, text) to anon, authenticated;
