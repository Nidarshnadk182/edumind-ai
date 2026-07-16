-- ─────────────────────────────────────────────────────────
-- EduMind AI — Learning content: materials, AI tutor, notes, quizzes, flashcards
-- ─────────────────────────────────────────────────────────

-- learning_materials
create table if not exists learning_materials (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references topics(id) on delete cascade,
  teacher_id uuid references teacher_profiles(id) on delete set null,
  title text not null,
  content text not null,
  is_ai_generated boolean not null default false,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_materials_topic on learning_materials(topic_id);
create index if not exists idx_materials_status on learning_materials(approval_status);

-- uploaded_files
create table if not exists uploaded_files (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  size_bytes bigint not null,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending','mock_extracted','extracted','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_uploaded_files_owner on uploaded_files(owner_id);

-- ai_conversations
create table if not exists ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_student on ai_conversations(student_id);

drop trigger if exists trg_ai_conversations_updated_at on ai_conversations;
create trigger trg_ai_conversations_updated_at before update on ai_conversations
  for each row execute function set_updated_at();

-- ai_messages
create table if not exists ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  is_demo_response boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_conversation on ai_messages(conversation_id);

-- generated_notes
create table if not exists generated_notes (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  title text not null,
  content text not null,
  length text not null default 'short' check (length in ('short','detailed','exam_focused')),
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create index if not exists idx_notes_student on generated_notes(student_id);

-- quizzes
create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  title text not null,
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  time_limit_minutes integer,
  source text not null default 'topic' check (source in ('topic','notes','upload','ai_conversation')),
  created_at timestamptz not null default now()
);

create index if not exists idx_quizzes_student on quizzes(student_id);

-- quiz_questions
create table if not exists quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_type text not null check (question_type in ('mcq','true_false','short_answer','numerical')),
  question_text text not null,
  options jsonb,
  correct_answer text not null,
  explanation text not null default '',
  order_index integer not null default 0
);

create index if not exists idx_quiz_questions_quiz on quiz_questions(quiz_id);

-- quiz_attempts
create table if not exists quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  student_id uuid not null references student_profiles(id) on delete cascade,
  score_percent numeric(5,2) not null default 0,
  time_taken_seconds integer not null default 0,
  completed_at timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_student on quiz_attempts(student_id);
create index if not exists idx_quiz_attempts_quiz on quiz_attempts(quiz_id);

-- quiz_answers
create table if not exists quiz_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  student_answer text not null default '',
  is_correct boolean not null default false
);

create index if not exists idx_quiz_answers_attempt on quiz_answers(attempt_id);

-- flashcard_decks
create table if not exists flashcard_decks (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_flashcard_decks_student on flashcard_decks(student_id);

-- flashcards
create table if not exists flashcards (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references flashcard_decks(id) on delete cascade,
  front text not null,
  back text not null,
  difficulty text check (difficulty in ('easy','medium','difficult')),
  is_starred boolean not null default false,
  spaced_repetition_stage integer not null default 0,
  next_review_at timestamptz
);

create index if not exists idx_flashcards_deck on flashcards(deck_id);
