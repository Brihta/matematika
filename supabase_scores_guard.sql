-- Brihta-MAT — sanity guards on the public leaderboard
--
-- WHY: the publishable key sits in script.js, so anyone who reads the page
-- source can POST straight to /rest/v1/scores. The 3-letter limit and the
-- A-ZČŠŽ filter in the app are client-side only and guarantee nothing.
-- These constraints move the rules to the one place that can enforce them.
--
-- Run in Supabase → SQL Editor. Check the SELECT at the bottom FIRST: if any
-- existing row violates a rule, the ALTER will fail until you clean it up.

-- ── 1. Inspect what is already in there ───────────────────────────────────
-- select name, score, day, created_at
--   from scores
--  where char_length(name) > 3
--     or name !~ '^[A-ZČŠŽ?]{1,3}$'
--     or score < 0 or score > 300
--  order by created_at desc;

-- ── 2. Name: at most 3 characters, capitals only ──────────────────────────
-- '?' is allowed because the app falls back to '???' when a child skips the
-- name prompt.
alter table scores drop constraint if exists scores_name_format;
alter table scores add constraint scores_name_format
  check (name ~ '^[A-ZČŠŽ?]{1,3}$');

-- ── 3. Score: within what 60 seconds can plausibly produce ────────────────
-- Max multiplier is 3x, and a very fast child answers roughly one question
-- per second, so 300 is generous headroom over any honest round.
alter table scores drop constraint if exists scores_score_range;
alter table scores add constraint scores_score_range
  check (score >= 0 and score <= 300);

-- ── 4. Day must be a real date, not arbitrary text ────────────────────────
alter table scores drop constraint if exists scores_day_format;
alter table scores add constraint scores_day_format
  check (day ~ '^\d{4}-\d{2}-\d{2}$');

-- ── OPTIONAL: cap how many scores one device can post per day ─────────────
-- Not expressible as a CHECK constraint. If kids start spamming the board,
-- the usual fix is an RLS policy plus a rate-limiting trigger, or moving the
-- insert behind a SECURITY DEFINER function the way login already works.
