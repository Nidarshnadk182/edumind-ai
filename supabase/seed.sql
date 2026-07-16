-- ─────────────────────────────────────────────────────────
-- EduMind AI — Seed data
-- Realistic sample data for an MBA Finance student.
-- No real personal or confidential data is used.
-- Run with: supabase db reset  (applies migrations then this file)
-- ─────────────────────────────────────────────────────────

-- Subjects
insert into subjects (id, name, slug, description) values
  ('11111111-1111-1111-1111-111111111101', 'Corporate Finance', 'corporate-finance', 'Capital budgeting, valuation, capital structure'),
  ('11111111-1111-1111-1111-111111111102', 'Derivatives', 'derivatives', 'Futures, options, swaps and risk management'),
  ('11111111-1111-1111-1111-111111111103', 'Strategic Management', 'strategic-management', 'Competitive strategy and organisational analysis'),
  ('11111111-1111-1111-1111-111111111104', 'Econometrics', 'econometrics', 'Regression analysis and statistical inference for economics')
on conflict (id) do nothing;

-- Topics
insert into topics (id, subject_id, name, slug, difficulty, order_index) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'Option Greeks', 'option-greeks', 'advanced', 1),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'Put-Call Parity', 'put-call-parity', 'intermediate', 2),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Weighted Average Cost of Capital', 'wacc', 'intermediate', 1),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 'Net Present Value', 'npv', 'beginner', 2),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111103', 'Porter''s Five Forces', 'five-forces', 'beginner', 1),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111104', 'Multiple Linear Regression', 'multiple-regression', 'advanced', 1),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111104', 'Heteroskedasticity', 'heteroskedasticity', 'advanced', 2)
on conflict (id) do nothing;

-- Achievements catalog
insert into achievements (id, name, description, icon, criteria) values
  ('33333333-3333-3333-3333-333333333301', 'First Steps', 'Complete your first quiz', 'footprints', 'quiz_attempts >= 1'),
  ('33333333-3333-3333-3333-333333333302', '7-Day Streak', 'Study for 7 days in a row', 'flame', 'streak_days >= 7'),
  ('33333333-3333-3333-3333-333333333303', 'Deck Master', 'Review 50 flashcards', 'layers', 'flashcards_reviewed >= 50'),
  ('33333333-3333-3333-3333-333333333304', 'Sharp Shooter', 'Score 90%+ on a quiz', 'target', 'quiz_score >= 90')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────
-- NOTE: auth.users rows normally come from Supabase Auth sign-up.
-- The block below is illustrative demo-account seeding intended for
-- local development only (Supabase CLI seed step), consistent with
-- the app's built-in DEMO_MODE mock-data fallback used when no
-- Supabase project is configured at all. In a hosted environment,
-- create the demo auth users via the Supabase dashboard or CLI first,
-- then re-run this file so the foreign keys resolve.
-- ─────────────────────────────────────────────────────────

-- Example (uncomment and adjust ids after creating the auth users):
-- insert into profiles (id, role, full_name, preferred_language) values
--   ('44444444-4444-4444-4444-444444444401', 'student', 'Demo MBA Student', 'en');
--
-- insert into student_profiles (
--   id, profile_id, education_level, subjects, learning_goals,
--   preferred_learning_style, daily_study_minutes, exam_date, xp_points,
--   current_streak_days, longest_streak_days
-- ) values (
--   '55555555-5555-5555-5555-555555555501',
--   '44444444-4444-4444-4444-444444444401',
--   'MBA - Finance', array['Corporate Finance','Derivatives','Strategic Management','Econometrics'],
--   'Build strong intuition for derivatives pricing and pass the finance elective with distinction',
--   'reading_writing', 45, current_date + interval '45 days', 1280, 6, 14
-- );
--
-- insert into learning_progress (student_id, topic_id, mastery_score, last_quiz_score, attempts_count, doubts_count, status) values
--   ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', 42, 55, 3, 4, 'in_progress'),  -- weak: Option Greeks
--   ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222202', 78, 82, 2, 1, 'in_progress'),  -- moderate: Put-Call Parity
--   ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222203', 88, 90, 4, 0, 'completed'),   -- strong: WACC
--   ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222204', 95, 96, 3, 0, 'completed'),   -- strong: NPV
--   ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222206', 35, 40, 2, 5, 'in_progress'); -- weak: Multiple Regression

-- The application's demo-mode mock layer (lib/database/demo-data.ts) mirrors
-- this exact seed so the UI looks identical whether running against a real
-- Supabase project or with zero configuration.
