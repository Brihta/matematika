-- Brihta-MAT — učiteljski računi: registracija z e-naslovom
--
-- Obstoječa funkcija login_teacher() se NE spreminja. Vse novo je dodano
-- poleg nje, tako da tvoja sedanja prijava deluje ves čas, tudi če se pri
-- tem karkoli zalomi.
--
-- Zaženi v Supabase → SQL Editor. Korake 6 in 7 moraš urediti sam.
--
-- ZAKAJ KODA IN POTRDITEV: učiteljski račun vidi rezultate vseh učencev
-- šole in lahko ponastavi geslo kateremukoli učencu. Stran je javna in
-- ključ je viden v izvorni kodi, zato bi odprta registracija pomenila, da
-- si lahko vsak učenec ustvari učiteljski dostop.

-- ── 1. Novi stolpci ───────────────────────────────────────────────────────
alter table teachers add column if not exists email text;
alter table teachers add column if not exists approved boolean not null default false;

create unique index if not exists teachers_email_unique
  on teachers (lower(email)) where email is not null;

-- Obstoječi računi so tvoji, zato jih takoj odobrimo — sicer bi se po tej
-- migraciji nihče več ne mogel prijaviti.
update teachers set approved = true where approved = false;

-- ── 2. Šolska koda ────────────────────────────────────────────────────────
create table if not exists app_config (
  key text primary key,
  value text not null
);
-- RLS brez politik = z javnim ključem ni dostopa. Funkcije spodaj so
-- SECURITY DEFINER, zato kodo vseeno preberejo.
alter table app_config enable row level security;

insert into app_config (key, value)
values ('teacher_code', 'ZAMENJAJ-ME')
on conflict (key) do nothing;

-- ── 3. Registracija ───────────────────────────────────────────────────────
-- Vrne eno besedo, da aplikacija ve, kaj povedati uporabniku.
create or replace function public.register_teacher(
  p_email text, p_password text, p_code text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_email text;
  v_code  text;
  v_base  text;
  v_name  text;
  i       int := 0;
begin
  v_email := lower(trim(coalesce(p_email, '')));

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return 'BAD_EMAIL';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    return 'WEAK_PASSWORD';
  end if;

  select value into v_code from app_config where key = 'teacher_code';
  if coalesce(p_code, '') <> coalesce(v_code, '') then
    return 'BAD_CODE';
  end if;

  if exists (select 1 from teachers where lower(email) = v_email) then
    return 'EXISTS';
  end if;

  -- username se uporablja za prikaz; iz e-naslova, s številko ob podvojitvi
  v_base := split_part(v_email, '@', 1);
  v_name := v_base;
  while exists (select 1 from teachers where username = v_name) loop
    i := i + 1;
    v_name := v_base || i::text;
  end loop;

  insert into teachers (username, email, pin_hash, approved)
  values (v_name, v_email, crypt(p_password, gen_salt('bf')), false);

  return 'PENDING';
end; $$;

-- ── 4. Prijava z e-naslovom ───────────────────────────────────────────────
-- Vrne vrstico tudi, kadar račun še ni potrjen, da aplikacija loči
-- "še nisi potrjen" od "napačno geslo". Račun brez potrditve ne more nič.
-- Postgres ne dovoli, da bi obstoječi funkciji s "create or replace"
-- spremenil, kaj vrača — zato jo prej odstranimo.
drop function if exists public.login_teacher_email(text, text);

create or replace function public.login_teacher_email(
  p_email text, p_password text)
returns table(id uuid, username text, email text, approved boolean)
language plpgsql security definer set search_path = public, extensions
as $$
declare r record;
begin
  select t.id, t.username, t.email, t.approved, t.pin_hash into r
    from teachers t
   where lower(t.email) = lower(trim(coalesce(p_email, '')));

  if not found then return; end if;
  if r.pin_hash is null then return; end if;
  if r.pin_hash <> crypt(coalesce(p_password, ''), r.pin_hash) then return; end if;

  return query select r.id, r.username, r.email, r.approved;
end; $$;

-- ── 4b. Učitelj si sam zamenja geslo ──────────────────────────────────────
-- Zahteva staro geslo, zato je varno klicati iz aplikacije. Brez tega bi
-- moral Nino menjati gesla v SQL-u vsakič, ko kdo pozabi ali želi svojega.
create or replace function public.change_teacher_password(
  p_email text, p_old text, p_new text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare r record;
begin
  if length(coalesce(p_new, '')) < 8 then return 'WEAK_PASSWORD'; end if;

  select t.id, t.pin_hash into r
    from teachers t
   where lower(t.email) = lower(trim(coalesce(p_email, '')));

  if not found then return 'BAD_LOGIN'; end if;
  if r.pin_hash is null then return 'BAD_LOGIN'; end if;
  if r.pin_hash <> crypt(coalesce(p_old, ''), r.pin_hash) then return 'BAD_LOGIN'; end if;

  update teachers set pin_hash = crypt(p_new, gen_salt('bf')) where id = r.id;
  return 'OK';
end; $$;

-- ── 5. Potrditev računa se ne da klicati iz aplikacije ────────────────────
-- Namenoma ni funkcije za odobritev: potrjuješ ročno, tukaj v SQL Editorju
-- (korak 7). Tako odobritve ni mogoče sprožiti z javnim ključem.

-- ══════════════════════════════════════════════════════════════════════════
-- SPODAJ MORAŠ UREDITI SAM
-- ══════════════════════════════════════════════════════════════════════════

-- ── 6. Nastavi šolsko kodo in svoj račun ──────────────────────────────────
-- Kodo povej samo zaposlenim. Geslo zamenjaj — staro si delil v klepetu.
--
-- update app_config set value = 'NEKA-KODA-2026' where key = 'teacher_code';
--
-- update teachers
--    set email     = 'nino.kokalj@gmail.com',
--        approved  = true,
--        pin_hash  = crypt('NOVO-DOLGO-GESLO', gen_salt('bf'))
--  where username = 'brihta';
--
-- Če javi "function crypt(...) does not exist", je pgcrypto v shemi
-- extensions — takrat napiši extensions.crypt(...) in extensions.gen_salt(...).
-- Znotraj funkcij zgoraj je to že urejeno (search_path).

-- Če imaš še kakšen star učiteljski račun, mu dodaj e-naslov in geslo,
-- sicer se z njim ne bo mogoče prijaviti (prijava gre zdaj po e-naslovu):
--
-- select username, email, approved, created_at from teachers order by created_at;

-- ── 6b. Računi, ki jih pripraviš vnaprej ─────────────────────────────────
-- Za vsako učiteljico ena vrstica. username je le za prikaz v aplikaciji.
-- Geslo naj bo začasno — ob prvi prijavi si ga zamenja sama (gumb
-- "Spremeni geslo" v učiteljskem pregledu). approved = true, ker jih
-- ustvarjaš ti, zato ni ničesar za potrjevati.
--
-- insert into teachers (username, email, pin_hash, approved) values
--   ('ana',   'ana.novak@sola.si', crypt('Zacetno-geslo-01', gen_salt('bf')), true),
--   ('marko', 'marko.kos@sola.si', crypt('Zacetno-geslo-02', gen_salt('bf')), true);
--
-- Pregled, kdo obstaja:
-- select username, email, approved from teachers order by created_at;

-- ── 7. Vsakodnevno: kdo čaka na potrditev, in kako ga potrdiš ─────────────
--
-- select email, username, created_at
--   from teachers where approved = false order by created_at;
--
-- update teachers set approved = true where lower(email) = 'kolega@sola.si';
--
-- Odvzem dostopa:
-- update teachers set approved = false where lower(email) = 'kolega@sola.si';
