-- ─────────────────────────────────────────────────────────
-- EduMind AI — Core schema (profiles, roles, institutions, classes)
-- ─────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- Roles enum
do $$ begin
  create type user_role as enum ('student', 'teacher', 'parent', 'institution');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type learning_style as enum ('visual', 'auditory', 'reading_writing', 'kinesthetic');
exception
  when duplicate_object then null;
end $$;

-- profiles: one row per authenticated user, extends auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  avatar_url text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on profiles(role);

-- institutions
create table if not exists institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  admin_profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_institutions_admin on institutions(admin_profile_id);

-- student_profiles
create table if not exists student_profiles (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  education_level text not null,
  subjects text[] not null default '{}',
  learning_goals text default '',
  preferred_learning_style learning_style not null default 'visual',
  daily_study_minutes integer not null default 30,
  exam_date date,
  xp_points integer not null default 0,
  current_streak_days integer not null default 0,
  longest_streak_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_student_profiles_profile on student_profiles(profile_id);

-- teacher_profiles
create table if not exists teacher_profiles (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  institution_id uuid references institutions(id) on delete set null,
  subjects_taught text[] not null default '{}',
  grade_or_class text default '',
  teaching_objectives text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teacher_profiles_institution on teacher_profiles(institution_id);

-- subjects (global catalog)
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text
);

-- topics (belong to a subject)
create table if not exists topics (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  slug text not null,
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  order_index integer not null default 0,
  unique(subject_id, slug)
);

create index if not exists idx_topics_subject on topics(subject_id);

-- classes
create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject_id uuid not null references subjects(id),
  teacher_id uuid not null references teacher_profiles(id) on delete cascade,
  class_code text not null unique,
  institution_id uuid references institutions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_classes_teacher on classes(teacher_id);

-- class_members
create table if not exists class_members (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references student_profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(class_id, student_id)
);

create index if not exists idx_class_members_class on class_members(class_id);
create index if not exists idx_class_members_student on class_members(student_id);

-- parent_student_links (consent-based)
create table if not exists parent_student_links (
  id uuid primary key default uuid_generate_v4(),
  parent_profile_id uuid not null references profiles(id) on delete cascade,
  student_profile_id uuid not null references profiles(id) on delete cascade,
  consent_confirmed boolean not null default false,
  linked_at timestamptz not null default now(),
  unique(parent_profile_id, student_profile_id)
);

create index if not exists idx_parent_links_parent on parent_student_links(parent_profile_id);
create index if not exists idx_parent_links_student on parent_student_links(student_profile_id);

-- updated_at trigger helper
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_student_profiles_updated_at on student_profiles;
create trigger trg_student_profiles_updated_at before update on student_profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_teacher_profiles_updated_at on teacher_profiles;
create trigger trg_teacher_profiles_updated_at before update on teacher_profiles
  for each row execute function set_updated_at();
