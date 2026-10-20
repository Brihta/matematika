-- Brihta-MAT — obvestilo "Novo: ljubljenček!" (20. 10. 2026)
--
-- ZAKAJ: ljubljenček je odprt za vse (pet_config.open = true). Da ga otroci
-- opazijo, dobi vsak učenec, ki si v tej sezoni še ni izbral ljubljenčka,
-- enkratno obvestilo z gumbom "Izberi ljubljenčka" (album.js, NOTICE).
-- Kdor si ga izbere, preden se prijavi, obvestila ne vidi — aplikacija ga
-- tiho označi kot prebrano.
--
-- Zahteva supabase_spremljevalci.sql (tabela album_notices). Datoteko lahko
-- zaženeš večkrat: učenec, ki obvestilo že ima, ga ne dobi še enkrat.
--
-- Zaženi v Supabase → SQL Editor.

insert into album_notices (student_id, code)
select s.id, 'ljubljencek-2026-10'
  from students s
 where not exists (select 1 from student_pets p
                    where p.student_id = s.id and p.season = (_album_season()).id)
on conflict (student_id, code) do nothing;

-- Preveri: koliko jih je dobilo obvestilo in koliko ga je že videlo
--
-- select count(*) as dobili, count(seen_at) as videli
--   from album_notices where code = 'ljubljencek-2026-10';
