-- Brihta-MAT — dnevna lestvica: en otrok = ena vrstica, prijavljeni z imenom
--
-- ZAKAJ: dober otrok postavi rekord, nato vadi celo uro, vsakič vpiše
-- rezultat — in kmalu je vseh 10 mest njegovih. Drugi otroci izginejo z
-- lestvice na projektorju, čeprav so se trudili.
--
-- REŠITEV:
--   1. Lestvica pokaže samo NAJBOLJŠI rezultat vsakega imena. Vsi poskusi se
--      še vedno shranijo (za statistiko), na lestvici pa je vsak le enkrat.
--   2. Prijavljen učenec ne vpisuje začetnic: rezultat se samodejno shrani
--      pod njegovim uporabniškim imenom. Zato mora stolpec name sprejeti
--      tudi uporabniška imena, ne le 3 velikih črk.
--
-- Zaženi v Supabase → SQL Editor.

-- ── 1. Ime: 3 začetnice ALI uporabniško ime ───────────────────────────────
-- Prejšnje pravilo (supabase_scores_guard.sql) je dovolilo samo A–Ž, 1–3
-- znake, zato bi bil vpis z uporabniškim imenom zavrnjen.
alter table scores drop constraint if exists scores_name_format;
alter table scores add constraint scores_name_format
  check (char_length(name) between 1 and 30);

-- ── 2. Lestvica dneva: najboljši rezultat vsakega imena, prvih 10 ────────
-- Pri enakem rezultatu je višje tisti, ki ga je dosegel prej.
create or replace function public.get_daily_board(p_day date)
returns table(name text, score int, created_at timestamptz)
language sql stable
as $$
  select b.name, b.score, b.created_at
    from (
      select distinct on (s.name)
             s.name::text as name, s.score::int as score,
             s.created_at::timestamptz as created_at
        from scores s
       where s.day = p_day
       order by s.name, s.score desc, s.created_at asc
    ) b
   order by b.score desc, b.created_at asc
   limit 10;
$$;
