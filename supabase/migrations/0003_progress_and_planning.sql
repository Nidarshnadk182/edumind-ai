-- ─────────────────────────────────────────────────────────
-- EduMind AI — Progress, recommendations, study plans, gamification
-- ─────────────────────────────────────────────────────────

-- learning_progress
create table if not exists learning_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  mastery_score numeric(5,2) not null default 0,
  last_quiz_score numeric(5,2),
  attempts_count integer not null default 0,
  doubts_count integer not null default 0,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  updated_at timestamptz not null default now(),
  unique(student_id, topic_id)
);

create index if not exists idx_progress_student on learning_progress(student_id);

drop trigger if exists trg_progress_updated_at on learning_progress;
create trigger trg_progress_updated_at before update on learning_progress
  for each row execute function set_updated_at();

-- recommendations (output of the rule-based recommendation engine)
create table if not exists recommendations (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  priority_score numeric(6,2) not null default 0,
  reasons text[] not null default '{}',
  generated_at timestamptz not null default now()
);

create index if not exists idx_recommendations_student on recommendations(student_id);

-- study_plans
create table if not exists study_plans (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  exam_name text not null,
  exam_date date not null,
  subjects text[] not null default '{}',
  available_hours_per_day numeric(4,2) not null default 2,
  created_at timestamptz not null default now()
);

create index if not exists idx_study_plans_student on study_plans(student_id);

-- study_tasks
create table if not exists study_tasks (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references study_plans(id) on delete cascade,
  date date not null,
  topic_id uuid references topics(id) on delete set null,
  task_type text not null default 'study' check (task_type in ('study','revision','mock_test')),
  duration_minutes integer not null default 30,
  is_completed boolean not null default false
);

create index if not exists idx_study_tasks_plan on study_tasks(plan_id);
create index if not exists idx_study_tasks_date on study_tasks(date);

-- achievements (catalog)
create table if not exists achievements (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  icon text not null default 'award',
  criteria text not null
);

-- user_achievements
create table if not exists user_achievements (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(student_id, achievement_id)
);

create index if not exists idx_user_achievements_student on user_achievements(student_id);

-- teacher_reviews (approval workflow for AI-generated content)
create table if not exists teacher_reviews (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid not null references learning_materials(id) on delete cascade,
  teacher_id uuid not null references teacher_profiles(id) on delete cascade,
  decision text not null check (decision in ('approved','rejected')),
  comment text,
  reviewed_at timestamptz not null default now()
);

create index if not exists idx_teacher_reviews_material on teacher_reviews(material_id);
create index if not exists idx_teacher_reviews_teacher on teacher_reviews(teacher_id);
