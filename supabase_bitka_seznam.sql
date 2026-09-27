-- Brihta-MAT — ⚔️ seznam odprtih bitk (projektor za učitelja + seznam za učence)
--
-- ZAKAJ: otroci v razredu ne vedo, katere bitke čakajo. Učitelj lahko na
-- projektorju pokaže vse čakalnice (koda, gostitelj, igralci) in bitke, ki
-- že potekajo, z rezultati v živo. Prijavljeni učenci vidijo iste
-- čakalnice na zaslonu Bitka in se pridružijo z enim dotikom.
--
-- ZASEBNOST: seznam pove, kateri otroci so ta trenutek na spletu, zato ga
-- funkcija vrne SAMO potrjenemu učitelju ali obstoječemu učenčevemu
-- računu. Neprijavljen obiskovalec javne strani dobi null. Žetonov igralcev
-- funkcija nikoli ne vrne.
--
-- Zahteva supabase_bitka.sql. Zaženi enkrat v Supabase → SQL Editor.

create or replace function public.list_open_battles(
  p_teacher uuid default null, p_student uuid default null)
returns json
language plpgsql security definer set search_path = public
as $$
begin
  if not (exists (select 1 from teachers t where t.id = p_teacher and t.approved)
       or exists (select 1 from students s where s.id = p_student)) then
    return null;
  end if;

  return json_build_object(
    'now', (extract(epoch from clock_timestamp()) * 1000)::bigint,
    'battles', coalesce((
      select json_agg(x.obj order by x.running, x.created_at desc)
        from (
          select b.status = 'running' as running, b.created_at,
                 json_build_object(
                   'code',      b.code,
                   'status',    b.status,
                   'host',      b.host_player,
                   'starts_at', (extract(epoch from b.starts_at) * 1000)::bigint,
                   'ends_at',   (extract(epoch from b.ends_at)   * 1000)::bigint,
                   'players',   coalesce((
                      select json_agg(json_build_object(
                               'id', p.id, 'name', p.name, 'emoji', p.emoji,
                               'score', p.score)
                             order by p.score desc, p.joined_at)
                        from battle_players p where p.battle_id = b.id), '[]'::json)
                 ) as obj
            from battles b
           where b.created_at > now() - interval '12 hours'
             and (
               -- čakalnica, v kateri je vsaj nekdo še prisoten (stran odprta)
               (b.status = 'lobby' and exists (
                  select 1 from battle_players p
                   where p.battle_id = b.id
                     and p.last_seen > now() - interval '20 seconds'))
               -- ali bitka, ki ta trenutek poteka
               or (b.status = 'running' and now() <= b.ends_at)
             )
           order by b.created_at desc
           limit 40
        ) x), '[]'::json)
  );
end; $$;

-- ── Hitri test ────────────────────────────────────────────────────────────
-- Brez veljavnega računa mora vrniti null:
-- select public.list_open_battles(null, null);
-- Z učiteljskim id (select id from teachers):
-- select public.list_open_battles('TVOJ-UCITELJSKI-ID'::uuid, null);
