-- Brihta-MAT — učitelj združi ali izbriše račun učenca
--
-- ZAKAJ: otroci pozabijo geslo in si naredijo nov račun. Na izpisu je potem
-- pet Jonov, vsak z delom vadbe, Brihtometer pa nikoli ne pokaže celega
-- otroka. Združitev prenese vadbo iz starega računa v tistega, ki ga otrok
-- obdrži, in stari račun izbriše. Brisanje je za račune, ki jih res nihče
-- več ne rabi (vadba se izgubi).
--
-- Zaščita je enaka kot pri ponastavitvi gesla in popravku imena: samo
-- veljaven ID potrjenega učitelja.
--
-- Vsaka funkcija je en sam korak: če se karkoli zalomi, se ne spremeni nič,
-- aplikacija pa dobi besedilo napake ("NAPAKA: ...").
--
-- Zaženi v Supabase → SQL Editor.

-- ── Združi: vadba iz p_from gre v p_into, p_from se izbriše ───────────────
create or replace function public.merge_students(
  p_teacher_id uuid, p_from text, p_into text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_from uuid; v_into uuid;
begin
  if not exists (
    select 1 from teachers where id = p_teacher_id and approved
  ) then
    return 'NI_DOVOLJENJA';
  end if;

  select id into v_from from students where lower(username) = lower(btrim(coalesce(p_from, '')));
  select id into v_into from students where lower(username) = lower(btrim(coalesce(p_into, '')));
  if v_from is null or v_into is null then return 'NI_UCENCA'; end if;
  if v_from = v_into then return 'ISTI'; end if;

  begin
    -- stats: kjer imata oba isti dan in način, prištej k eni vrstici ciljnega
    -- računa; ostale vrstice samo prestavi.
    update stats t
       set correct = coalesce(t.correct, 0) + f.correct,
           wrong   = coalesce(t.wrong,   0) + f.wrong,
           points  = coalesce(t.points,  0) + f.points,
           seconds = coalesce(t.seconds, 0) + f.seconds
      from (select day, mode,
                   coalesce(sum(correct), 0) as correct, coalesce(sum(wrong), 0) as wrong,
                   coalesce(sum(points),  0) as points,  coalesce(sum(seconds), 0) as seconds
              from stats where student_id = v_from group by day, mode) f
     where t.ctid = (select s2.ctid from stats s2
                      where s2.student_id = v_into and s2.day = f.day and s2.mode = f.mode
                      limit 1);
    delete from stats f
     where f.student_id = v_from
       and exists (select 1 from stats t
                    where t.student_id = v_into and t.day = f.day and t.mode = f.mode);
    update stats set student_id = v_into where student_id = v_from;

    -- table_stats: enako, ključ je dan + poštevanka + operacija
    update table_stats t
       set correct = coalesce(t.correct, 0) + f.correct,
           wrong   = coalesce(t.wrong,   0) + f.wrong
      from (select day, table_n, op,
                   coalesce(sum(correct), 0) as correct, coalesce(sum(wrong), 0) as wrong
              from table_stats where student_id = v_from group by day, table_n, op) f
     where t.ctid = (select s2.ctid from table_stats s2
                      where s2.student_id = v_into and s2.day = f.day
                        and s2.table_n = f.table_n and s2.op = f.op
                      limit 1);
    delete from table_stats f
     where f.student_id = v_from
       and exists (select 1 from table_stats t
                    where t.student_id = v_into and t.day = f.day
                      and t.table_n = f.table_n and t.op = f.op);
    update table_stats set student_id = v_into where student_id = v_from;

    -- table_speed (supabase_hitrost.sql) ima primarni ključ, zato gre krajše
    insert into table_speed (student_id, day, table_n, op, timed, fast)
    select v_into, day, table_n, op, timed, fast
      from table_speed where student_id = v_from
    on conflict (student_id, day, table_n, op) do update
       set timed = table_speed.timed + excluded.timed,
           fast  = table_speed.fast  + excluded.fast;
    delete from table_speed where student_id = v_from;

    -- Ime in razred: če jih ciljni račun nima, jih vzemi od starega
    update students t
       set display_name = coalesce(t.display_name, f.display_name),
           letnik       = coalesce(t.letnik,       f.letnik),
           oddelek      = coalesce(t.oddelek,      f.oddelek)
      from students f
     where t.id = v_into and f.id = v_from;

    delete from students where id = v_from;
  exception when others then
    return 'NAPAKA: ' || sqlerrm;
  end;

  return 'OK';
end; $$;

-- ── Izbriši: račun in vsa njegova vadba ───────────────────────────────────
create or replace function public.delete_student(
  p_teacher_id uuid, p_username text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not exists (
    select 1 from teachers where id = p_teacher_id and approved
  ) then
    return 'NI_DOVOLJENJA';
  end if;

  select id into v_id from students where lower(username) = lower(btrim(coalesce(p_username, '')));
  if v_id is null then return 'NI_UCENCA'; end if;

  begin
    delete from stats       where student_id = v_id;
    delete from table_stats where student_id = v_id;
    delete from table_speed where student_id = v_id;
    delete from students    where id = v_id;
  exception when others then
    return 'NAPAKA: ' || sqlerrm;
  end;

  return 'OK';
end; $$;

-- ── Če aplikacija javi "NAPAKA: ... violates foreign key constraint" ──────
-- Na učenca kaže še kakšna tabela, ki je tukaj ni. Poglej, katera:
--
-- select conrelid::regclass as tabela, conname
--   from pg_constraint
--  where confrelid = 'public.students'::regclass and contype = 'f';
