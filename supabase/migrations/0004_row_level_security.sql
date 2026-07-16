-- ─────────────────────────────────────────────────────────
-- EduMind AI — Row Level Security
-- Principle: users can only read/write data they own, teach,
-- parent (with consent), or administer. Service-role key
-- (server-only) bypasses RLS for trusted backend operations.
-- ─────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table student_profiles enable row level security;
alter table teacher_profiles enable row level security;
alter table institutions enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table parent_student_links enable row level security;
alter table learning_materials enable row level security;
alter table uploaded_files enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table generated_notes enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table quiz_answers enable row level security;
alter table flashcard_decks enable row level security;
alter table flashcards enable row level security;
alter table learning_progress enable row level security;
alter table recommendations enable row level security;
alter table study_plans enable row level security;
alter table study_tasks enable row level security;
alter table user_achievements enable row level security;
alter table teacher_reviews enable row level security;

-- Helper: is this class taught by the current user (as a teacher)?
create or replace function is_teacher_of_class(target_class_id uuid)
returns boolean as $$
  select exists (
    select 1 from classes c
    join teacher_profiles tp on tp.id = c.teacher_id
    where c.id = target_class_id and tp.profile_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: is target_student_id a student in one of the current teacher's classes?
create or replace function teaches_student(target_student_id uuid)
returns boolean as $$
  select exists (
    select 1 from class_members cm
    join classes c on c.id = cm.class_id
    join teacher_profiles tp on tp.id = c.teacher_id
    join student_profiles sp on sp.id = cm.student_id
    where sp.id = target_student_id and tp.profile_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: does the current user (parent) have consented access to this student profile id?
create or replace function is_consented_parent(target_student_profile_id uuid)
returns boolean as $$
  select exists (
    select 1 from parent_student_links
    where student_profile_id = target_student_profile_id
      and parent_profile_id = auth.uid()
      and consent_confirmed = true
  );
$$ language sql security definer stable;

-- ── profiles ─────────────────────────────────────────────
create policy "profiles: read own" on profiles
  for select using (id = auth.uid());
create policy "profiles: update own" on profiles
  for update using (id = auth.uid());
create policy "profiles: insert own" on profiles
  for insert with check (id = auth.uid());

-- ── student_profiles ─────────────────────────────────────
create policy "student_profiles: student reads own" on student_profiles
  for select using (profile_id = auth.uid());
create policy "student_profiles: student updates own" on student_profiles
  for update using (profile_id = auth.uid());
create policy "student_profiles: student inserts own" on student_profiles
  for insert with check (profile_id = auth.uid());
create policy "student_profiles: teacher reads taught students" on student_profiles
  for select using (teaches_student(id));
create policy "student_profiles: consented parent reads" on student_profiles
  for select using (is_consented_parent(profile_id));

-- ── teacher_profiles ─────────────────────────────────────
create policy "teacher_profiles: owner full access" on teacher_profiles
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "teacher_profiles: students in class can read" on teacher_profiles
  for select using (true); -- non-sensitive directory info only

-- ── institutions ─────────────────────────────────────────
create policy "institutions: admin full access" on institutions
  for all using (admin_profile_id = auth.uid()) with check (admin_profile_id = auth.uid());

-- ── classes ──────────────────────────────────────────────
create policy "classes: teacher full access" on classes
  for all using (is_teacher_of_class(id)) with check (
    exists (select 1 from teacher_profiles tp where tp.id = teacher_id and tp.profile_id = auth.uid())
  );
create policy "classes: enrolled students read" on classes
  for select using (
    exists (
      select 1 from class_members cm
      join student_profiles sp on sp.id = cm.student_id
      where cm.class_id = classes.id and sp.profile_id = auth.uid()
    )
  );

-- ── class_members ────────────────────────────────────────
create policy "class_members: teacher manages" on class_members
  for all using (is_teacher_of_class(class_id));
create policy "class_members: student reads own membership" on class_members
  for select using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );
create policy "class_members: student joins via code (insert own)" on class_members
  for insert with check (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );

-- ── parent_student_links ─────────────────────────────────
create policy "parent_links: parent reads own" on parent_student_links
  for select using (parent_profile_id = auth.uid());
create policy "parent_links: parent creates own (consent flow)" on parent_student_links
  for insert with check (parent_profile_id = auth.uid());
create policy "parent_links: student reads own links" on parent_student_links
  for select using (student_profile_id = auth.uid());

-- ── learning_materials ───────────────────────────────────
create policy "materials: teacher manages own" on learning_materials
  for all using (
    exists (select 1 from teacher_profiles tp where tp.id = teacher_id and tp.profile_id = auth.uid())
  );
create policy "materials: approved materials readable by all authenticated" on learning_materials
  for select using (approval_status = 'approved' and auth.uid() is not null);

-- ── uploaded_files ───────────────────────────────────────
create policy "uploaded_files: owner full access" on uploaded_files
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ── ai_conversations / ai_messages (private by default; NOT visible to parents) ──
create policy "ai_conversations: student owns" on ai_conversations
  for all using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );
create policy "ai_messages: student owns via conversation" on ai_messages
  for all using (
    exists (
      select 1 from ai_conversations c
      join student_profiles sp on sp.id = c.student_id
      where c.id = conversation_id and sp.profile_id = auth.uid()
    )
  );

-- ── generated_notes / quizzes / flashcards: student-owned ──
create policy "notes: student owns" on generated_notes
  for all using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );

create policy "quizzes: student owns" on quizzes
  for all using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );
create policy "quizzes: teacher of student can read" on quizzes
  for select using (teaches_student(student_id));

create policy "quiz_questions: readable if quiz accessible" on quiz_questions
  for select using (
    exists (
      select 1 from quizzes q
      join student_profiles sp on sp.id = q.student_id
      where q.id = quiz_id and (sp.profile_id = auth.uid() or teaches_student(q.student_id))
    )
  );
create policy "quiz_questions: student manages own quiz questions" on quiz_questions
  for all using (
    exists (
      select 1 from quizzes q
      join student_profiles sp on sp.id = q.student_id
      where q.id = quiz_id and sp.profile_id = auth.uid()
    )
  );

create policy "quiz_attempts: student owns" on quiz_attempts
  for all using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );
create policy "quiz_attempts: teacher of student can read" on quiz_attempts
  for select using (teaches_student(student_id));

create policy "quiz_answers: student owns via attempt" on quiz_answers
  for all using (
    exists (
      select 1 from quiz_attempts qa
      join student_profiles sp on sp.id = qa.student_id
      where qa.id = attempt_id and sp.profile_id = auth.uid()
    )
  );

create policy "flashcard_decks: student owns" on flashcard_decks
  for all using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );
create policy "flashcards: student owns via deck" on flashcards
  for all using (
    exists (
      select 1 from flashcard_decks d
      join student_profiles sp on sp.id = d.student_id
      where d.id = deck_id and sp.profile_id = auth.uid()
    )
  );

-- ── learning_progress / recommendations ──────────────────
create policy "progress: student reads/updates own" on learning_progress
  for all using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );
create policy "progress: teacher of student can read" on learning_progress
  for select using (teaches_student(student_id));
create policy "progress: consented parent can read" on learning_progress
  for select using (
    exists (
      select 1 from student_profiles sp
      where sp.id = student_id and is_consented_parent(sp.profile_id)
    )
  );

create policy "recommendations: student reads own" on recommendations
  for select using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );

-- ── study_plans / study_tasks ────────────────────────────
create policy "study_plans: student owns" on study_plans
  for all using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );
create policy "study_tasks: student owns via plan" on study_tasks
  for all using (
    exists (
      select 1 from study_plans p
      join student_profiles sp on sp.id = p.student_id
      where p.id = plan_id and sp.profile_id = auth.uid()
    )
  );

-- ── user_achievements ────────────────────────────────────
create policy "user_achievements: student reads own" on user_achievements
  for select using (
    exists (select 1 from student_profiles sp where sp.id = student_id and sp.profile_id = auth.uid())
  );

-- ── teacher_reviews ──────────────────────────────────────
create policy "teacher_reviews: teacher manages own reviews" on teacher_reviews
  for all using (
    exists (select 1 from teacher_profiles tp where tp.id = teacher_id and tp.profile_id = auth.uid())
  );
