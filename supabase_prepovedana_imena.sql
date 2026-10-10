-- Brihta-MAT — neprimerna imena na lestvici in v bitki
--
-- ZAKAJ: neprijavljen otrok na koncu tekmovanja vpiše začetnice (3 črke),
-- v bitki pa ime. Kdo je na lestvico vpisal "SEX" (10. 10. 2026). Lestvica in
-- bitka sta vidni vsem, tudi na projektorju v razredu.
--
-- KAJ NAREDI:
--   - Lestvica (scores): prepovedano ime se ob vpisu zamenja z '???'. Rezultat
--     ostane, otrok ne dobi napake — samo ime se ne pokaže.
--   - Bitka (battle_players): s prepovedanim imenom se ni mogoče pridružiti
--     ali ustvariti bitke (aplikacija pokaže splošno napako).
--   - Obstoječi vpisi na lestvici s prepovedanim imenom se takoj zamenjajo.
--
-- Seznam dopolniš kadarkoli, brez ponovnega zagona te datoteke:
--   insert into prepovedana_imena values ('XYZ') on conflict do nothing;
--   update scores set name = '???' where upper(btrim(name)) = 'XYZ';
-- Primerja se celo ime, brez razlike med velikimi in malimi črkami.
--
-- Zaženi v Supabase → SQL Editor (celo datoteko naenkrat).

create table if not exists prepovedana_imena (
  ime text primary key check (ime = upper(ime))
);
alter table prepovedana_imena enable row level security;

insert into prepovedana_imena (ime) values
  ('SEX'), ('SEKS'), ('FUK'), ('FAK'), ('FCK'), ('FUC'), ('KUR'), ('KUC'),
  ('PIČ'), ('PIZ'), ('JEB'), ('JBG'), ('DIK'), ('ASS'), ('CUM'), ('TIT'),
  ('WTF'), ('NIG'), ('KKK'), ('NAZ'), ('SRA'), ('PED'), ('GEJ'), ('PUS')
on conflict do nothing;

create or replace function public._ime_prepovedano(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from prepovedana_imena where ime = upper(btrim(coalesce(p_name, ''))));
$$;

-- Lestvica: ime → '???'
create or replace function public._scores_cisto_ime()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if _ime_prepovedano(new.name) then new.name := '???'; end if;
  return new;
end; $$;
drop trigger if exists scores_cisto_ime on scores;
create trigger scores_cisto_ime before insert or update of name on scores
  for each row execute function _scores_cisto_ime();

-- Bitka: zavrni (na projektorju bi se ime videlo, '???' bi lahko trčil z
-- drugim igralcem istega imena v isti bitki)
create or replace function public._bitka_cisto_ime()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if _ime_prepovedano(new.name) then
    raise exception 'neprimerno ime' using errcode = 'check_violation';
  end if;
  return new;
end; $$;
drop trigger if exists bitka_cisto_ime on battle_players;
create trigger bitka_cisto_ime before insert or update of name on battle_players
  for each row execute function _bitka_cisto_ime();

-- Že vpisani
update scores set name = '???' where _ime_prepovedano(name);
delete from battle_players where _ime_prepovedano(name);
