-- Functional platform upgrade: class metadata, reviews/publications, messaging and AI traceability.
create extension if not exists vector;

alter table subjects add column if not exists subject_code text;
create unique index if not exists idx_subjects_code on subjects(subject_code) where subject_code is not null;

alter table classes add column if not exists academic_year text;
alter table classes add column if not exists academic_term text;
alter table classes add column if not exists programme text;
alter table classes add column if not exists section_name text;
alter table classes add column if not exists archived_at timestamptz;

alter table learning_materials drop constraint if exists learning_materials_approval_status_check;
alter table learning_materials add constraint learning_materials_approval_status_check
  check (approval_status in ('draft','pending','approved','published','rejected','revision_requested','archived'));

create table if not exists content_reviews (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid not null references learning_materials(id) on delete cascade,
  reviewer_profile_id uuid not null references profiles(id) on delete cascade,
  decision text not null check (decision in ('approved','rejected','revision_requested')),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_content_reviews_material on content_reviews(material_id, created_at desc);

create table if not exists content_publications (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid not null references learning_materials(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('student','class')),
  recipient_id uuid not null,
  published_by uuid not null references profiles(id) on delete cascade,
  published_at timestamptz not null default now(),
  unique(material_id, recipient_type, recipient_id)
);
create index if not exists idx_publications_recipient on content_publications(recipient_type, recipient_id);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_recipient on notifications(recipient_profile_id, created_at desc);

create table if not exists ai_generations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  generation_type text not null,
  provider text not null,
  model_name text not null,
  prompt_version text not null,
  subject_id uuid references subjects(id) on delete set null,
  topic_id uuid references topics(id) on delete set null,
  source_document_ids uuid[] not null default '{}',
  source_references jsonb not null default '[]'::jsonb,
  approval_status text not null default 'pending',
  output jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default uuid_generate_v4(),
  uploaded_file_id uuid not null references uploaded_files(id) on delete cascade,
  owner_profile_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  class_id uuid references classes(id) on delete set null,
  page_number integer,
  heading text,
  chunk_order integer not null,
  content text not null,
  embedding vector(1024),
  created_at timestamptz not null default now(),
  unique(uploaded_file_id, chunk_order)
);
create index if not exists idx_document_chunks_owner on document_chunks(owner_profile_id);

create table if not exists conversation_threads (
  id uuid primary key default uuid_generate_v4(),
  student_profile_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  class_id uuid references classes(id) on delete set null,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create table if not exists conversation_participants (
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key(thread_id, profile_id)
);
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  sender_profile_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  attachment_path text,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists idx_messages_thread on messages(thread_id, created_at);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_profile_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
