-- Brihta-MAT — spremljevalci iz trgovine lika gredo (20. 10. 2026)
--
-- ZAKAJ: spremljevalca zdaj dobiš pri Do 20 — ljubljenček, ki ga učenec sam
-- oblikuje in vzgoji (supabase_ljubljencek.sql). Dva sistema spremljevalcev
-- sta bila preveč. Iz trgovine lika zato gredo Mačka (mucek, 90 cekinov),
-- Lisička (lisicka, 180) in Zmajček (zmajcek, napovedana nagrada zime).
-- Sovica Brihta ostane: je nagrada za polno stran Poštevanke.
--
-- KAJ NAREDI:
--   1. album_notices — enkratna obvestila učencem (pokaže jih album.js).
--   2. Vsakemu, ki je kupil Mačko ali Lisičko, zapiše obvestilo s tem, kaj
--      je imel in koliko cekinov dobi nazaj.
--   3. Vrne cekine: izbriše vrstice nakupa v coin_ledger (−90 / −180), zato
--      je stanje točno tako, kot da nakupa ne bi bilo.
--   4. Sleče jih z vseh likov, izbriše jih iz student_items in iz items.
--
-- Datoteko lahko zaženeš večkrat: drugič ni več kupcev, zato se nič ne
-- podvoji. Najprej zaženi to, potem objavi aplikacijo (lik.html teh
-- predmetov ne pozna več in bi jih samo tiho slekla).
--
-- Zaženi v Supabase → SQL Editor (celo datoteko naenkrat).

-- ── 1. Obvestila ──────────────────────────────────────────────────────────
create table if not exists album_notices (
  student_id uuid        not null references students(id) on delete cascade,
  code       text        not null,
  data       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  seen_at    timestamptz,
  primary key (student_id, code)
);
alter table album_notices enable row level security;

-- Neprebrana obvestila učenca: [{"code": "...", "data": {...}}] ali null.
create or replace function public.album_notices(p_student uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_agg(json_build_object('code', code, 'data', data) order by created_at)
    from album_notices where student_id = p_student and seen_at is null;
$$;

create or replace function public.album_notice_seen(p_student uuid, p_code text)
returns void language sql security definer set search_path = public as $$
  update album_notices set seen_at = now()
   where student_id = p_student and code = p_code and seen_at is null;
$$;

-- ── 2.–4. Odstranitev, vračilo, obvestilo ─────────────────────────────────
do $$
begin
  -- obvestilo kupcem, PREDEN se nakupi izbrišejo
  insert into album_notices (student_id, code, data)
  select si.student_id, 'spremljevalci-2026-10',
         json_build_object('items', json_agg(si.item_id order by si.item_id),
                           'coins', coalesce(sum(i.price), 0))::jsonb
    from student_items si join items i on i.id = si.item_id
   where si.item_id in ('mucek', 'lisicka') and si.source = 'buy'
   group by si.student_id
  on conflict (student_id, code) do nothing;

  -- vračilo: vrstica nakupa izgine, cekini so spet tam
  delete from coin_ledger where reason = 'buy' and ref in ('mucek', 'lisicka', 'zmajcek');

  -- sleči z vseh likov (equip: {"vitez": {"spremljevalec": "mucek", …}, …})
  update student_avatar a
     set equip = (select coalesce(jsonb_object_agg(k,
                    case when jsonb_typeof(v) = 'object' and v->>'spremljevalec' in ('mucek', 'lisicka', 'zmajcek')
                         then v - 'spremljevalec' else v end), '{}'::jsonb)
                    from jsonb_each(a.equip) e(k, v)),
         updated_at = now()
   where exists (select 1 from jsonb_each(a.equip) e(k, v)
                  where jsonb_typeof(v) = 'object' and v->>'spremljevalec' in ('mucek', 'lisicka', 'zmajcek'));

  delete from student_items where item_id in ('mucek', 'lisicka', 'zmajcek');
  delete from items where id in ('mucek', 'lisicka', 'zmajcek');
end $$;

-- ── Preveri ───────────────────────────────────────────────────────────────
-- Kdo dobi obvestilo in koliko cekinov mu je bilo vrnjenih:
--
-- select s.username, n.data, n.seen_at
--   from album_notices n join students s on s.id = n.student_id
--  where n.code = 'spremljevalci-2026-10' order by s.username;
