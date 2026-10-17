-- Brihta-MAT — dvorana slavnih tekmovanja + osebni rekord
--
-- ZAKAJ: dnevna lestvica se vsak dan izprazni, zato izjemen rezultat (125
-- točk v 60 s) naslednje jutro izgine. Dvorana slavnih ga obdrži za vedno,
-- tudi čez sezone (sezone se začnejo znova, dvorana ne).
--
-- KLUBI, NE LE PRVIH 10: kdor doseže prag, je v klubu za vedno. Tako je
-- "klub 100" cilj, ki ga otrok lahko doseže, namesto lestvice, ki zamrzne
-- z istimi imeni. Na vrhu je en rekord šole.
--   Klub 80+  ·  Klub 100+  ·  Klub 120+  (pragi so v script.js, HALL_CLUBS)
--
-- ZAKAJ comp_rounds IN NE scores: v scores lahko kdorkoli s ključem iz
-- script.js vpiše katerokoli ime in rezultat. comp_rounds piše samo
-- add_comp_round (supabase_album.sql), ki igro veže na prijavljenega
-- učenca in zavrne nemogoče (več kot 3 × pravilni, več kot 150 odgovorov,
-- izven 7–20 h). Za trajno slavo šteje samo tak rezultat.
--
-- Zahteva: supabase_album.sql (tabela comp_rounds).
-- Zaženi v Supabase → SQL Editor. Varno jo je zagnati večkrat.

-- ── Dvorana: najboljša igra vsakega učenca z vsaj 80 točkami ─────────────
-- Pri enakem rezultatu je višje tisti, ki ga je dosegel prej.
-- avatar: lik, kot ga je učenec sam opremil v albumu (null, če ga še nima).
-- Nariše ga script.js z risbo iz lik.html. Barve in predmete je ob shranjevanju
-- že preveril album_set_avatar.
drop function if exists public.get_hall_of_fame();
create or replace function public.get_hall_of_fame()
returns table(username text, emoji text, score int, day date, avatar json)
language sql stable security definer set search_path = public as $$
  select s.username::text, coalesce(s.emoji, '🦉')::text, b.score, b.day,
         (select json_build_object('form', a.form, 'skin', a.skin, 'hair', a.hair, 'eye', a.eye,
                   'style', a.style, 'equip', coalesce(a.equip -> coalesce(a.active_char,
                     (select sc.char_id from student_season_char sc
                       where sc.student_id = b.student_id order by sc.season desc limit 1), 'vitez'), '{}'::jsonb))
            from student_avatar a where a.student_id = b.student_id)
    from (select distinct on (student_id) student_id, score, day, created_at
            from comp_rounds
           where score >= 80
           order by student_id, score desc, created_at asc) b
    join students s on s.id = b.student_id
   order by b.score desc, b.created_at asc;
$$;

-- ── Osebni rekord: najboljša igra enega učenca (null, če še ni igral) ────
create or replace function public.get_comp_best(p_student uuid)
returns table(score int, day date)
language sql stable security definer set search_path = public as $$
  select score, day from comp_rounds
   where student_id = p_student
   order by score desc, created_at asc
   limit 1;
$$;

-- ── PREVERJANJE izjemnih rezultatov (zaženi ročno, ne spremeni ničesar) ──
-- Pri igri brez napake je rezultat 3 × pravilni − 13 (množilnik ×2 od 5.,
-- ×3 od 10. pravilnega zapored): 125 = 46 pravilnih, 0 napak.
-- select s.username, r.score, r.correct, r.wrong, r.day,
--        r.created_at at time zone 'Europe/Ljubljana' as ura
--   from comp_rounds r join students s on s.id = r.student_id
--  where r.score >= 100
--  order by r.score desc, r.created_at;
