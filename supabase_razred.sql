-- Brihta-MAT — add student class (razred)
-- Run once in Supabase → SQL Editor. Additive only; does NOT touch login or
-- get_class_overview, so existing auth keeps working.

-- 1. New column on the students table
alter table students add column if not exists razred text;

-- 2. Student saves their class (guards the 1A..9B format)
create or replace function public.set_student_razred(p_student uuid, p_razred text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_razred !~ '^[1-9][AB]$' then
    return;
  end if;
  update students set razred = p_razred where id = p_student;
end; $$;

-- 3. App reads a student's class (to decide whether to ask)
create or replace function public.get_student_razred(p_student uuid)
returns text
language sql
security definer
set search_path to 'public'
as $$
  select razred from students where id = p_student;
$$;

-- 4. Teacher reads class per student (mirrors get_class_overview's teacher guard)
create or replace function public.get_class_razreds(p_teacher_id uuid)
returns table(username text, razred text)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from teachers where id = p_teacher_id) then
    return;
  end if;
  return query select s.username, s.razred from students s;
end; $$;
