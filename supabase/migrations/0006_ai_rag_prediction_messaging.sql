-- EduMind AI v0.2 backend foundation: RAG, predictions, messaging and auditability.
create extension if not exists vector;

alter table subjects add column if not exists subject_code text;
alter table classes add column if not exists academic_year text;
alter table classes add column if not exists academic_term text;
alter table classes add column if not exists section_name text;

create table if not exists uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  visibility text not null default 'private' check (visibility in ('private','class','institution')),
  ingestion_status text not null default 'queued' check (ingestion_status in ('queued','processing','ready','failed')),
  ingestion_error text,
  page_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references uploaded_documents(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  owner_id uuid not null references profiles(id) on delete cascade,
  chunk_index integer not null,
  heading text,
  page_number integer,
  content text not null,
  token_count integer,
  embedding vector(1024),
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index if not exists document_chunks_document_idx on document_chunks(document_id);
create index if not exists document_chunks_subject_idx on document_chunks(subject_id);
create index if not exists document_chunks_class_idx on document_chunks(class_id);
create index if not exists document_chunks_embedding_idx on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function match_document_chunks(
  query_embedding vector(1024),
  match_count integer default 6,
  filter_subject_id uuid default null,
  filter_class_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  page_number integer,
  heading text,
  similarity float
)
language sql stable security invoker
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.page_number,
    dc.heading,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.embedding is not null
    and (filter_subject_id is null or dc.subject_id = filter_subject_id)
    and (filter_class_id is null or dc.class_id = filter_class_id)
  order by dc.embedding <=> query_embedding
  limit greatest(1, least(match_count, 12));
$$;

create table if not exists ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  subject_id uuid references subjects(id) on delete set null,
  generation_type text not null check (generation_type in ('tutor','notes','quiz','flashcards','study_plan','diagram','pdf')),
  provider text not null,
  model_name text not null,
  prompt_version text not null default 'v1',
  source_document_ids uuid[] not null default '{}',
  source_chunk_ids uuid[] not null default '{}',
  output_json jsonb,
  approval_status text not null default 'not_required' check (approval_status in ('not_required','pending','approved','rejected','revision_requested')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists student_prediction_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  expected_score numeric(5,2) not null,
  score_low numeric(5,2) not null,
  score_high numeric(5,2) not null,
  pass_probability numeric(5,2) not null,
  readiness_score numeric(5,2) not null,
  risk_level text not null check (risk_level in ('low','medium','high')),
  input_signals jsonb not null,
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists conversation_threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  subject_id uuid references subjects(id) on delete set null,
  created_by uuid not null references profiles(id),
  title text not null default 'Progress discussion',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists conversation_participants (
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key(thread_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  attachment_path text,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_created_idx on messages(thread_id, created_at);

alter table uploaded_documents enable row level security;
alter table document_chunks enable row level security;
alter table ai_generations enable row level security;
alter table student_prediction_snapshots enable row level security;
alter table conversation_threads enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

create policy "document owners manage documents" on uploaded_documents
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "document owners access chunks" on document_chunks
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "users access own generations" on ai_generations
for all using (user_id = auth.uid() or student_id = auth.uid())
with check (user_id = auth.uid());

create policy "students access own predictions" on student_prediction_snapshots
for select using (student_id = auth.uid());

create policy "participants access threads" on conversation_threads
for select using (exists (
  select 1 from conversation_participants cp
  where cp.thread_id = conversation_threads.id and cp.user_id = auth.uid()
));

create policy "participants access participant rows" on conversation_participants
for select using (exists (
  select 1 from conversation_participants me
  where me.thread_id = conversation_participants.thread_id and me.user_id = auth.uid()
));

create policy "participants read messages" on messages
for select using (exists (
  select 1 from conversation_participants cp
  where cp.thread_id = messages.thread_id and cp.user_id = auth.uid()
));

create policy "participants send messages" on messages
for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from conversation_participants cp
    where cp.thread_id = messages.thread_id and cp.user_id = auth.uid()
  )
);
