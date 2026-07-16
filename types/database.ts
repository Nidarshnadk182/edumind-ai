// ─────────────────────────────────────────────────────────
// EduMind AI — Core domain / database types
// Mirrors the Supabase schema in supabase/migrations/.
// ─────────────────────────────────────────────────────────

export type UserRole = 'student' | 'teacher' | 'parent' | 'institution';

export type LearningStyle = 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic';

export interface Profile {
  id: string; // uuid, references auth.users
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string; // uuid
  profile_id: string;
  education_level: string;
  subjects: string[];
  learning_goals: string;
  preferred_learning_style: LearningStyle;
  daily_study_minutes: number;
  exam_date: string | null;
  xp_points: number;
  current_streak_days: number;
  longest_streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface TeacherProfile {
  id: string;
  profile_id: string;
  institution_id: string | null;
  subjects_taught: string[];
  grade_or_class: string;
  teaching_objectives: string;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  name: string;
  admin_profile_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  subject_id: string;
  teacher_id: string;
  class_code: string;
  institution_id: string | null;
  created_at: string;
}

export interface ClassMember {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order_index: number;
}

export interface LearningMaterial {
  id: string;
  topic_id: string;
  teacher_id: string | null;
  title: string;
  content: string;
  is_ai_generated: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface UploadedFile {
  id: string;
  owner_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  size_bytes: number;
  extraction_status: 'pending' | 'mock_extracted' | 'extracted' | 'failed';
  created_at: string;
}

export interface AiConversation {
  id: string;
  student_id: string;
  topic_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  is_demo_response: boolean;
  created_at: string;
}

export interface GeneratedNote {
  id: string;
  student_id: string;
  topic_id: string | null;
  title: string;
  content: string;
  length: 'short' | 'detailed' | 'exam_focused';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  student_id: string;
  topic_id: string | null;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  time_limit_minutes: number | null;
  source: 'topic' | 'notes' | 'upload' | 'ai_conversation';
  created_at: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'numerical';

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  question_text: string;
  options: string[] | null; // for MCQ
  correct_answer: string;
  explanation: string;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score_percent: number;
  time_taken_seconds: number;
  completed_at: string;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  student_answer: string;
  is_correct: boolean;
}

export interface FlashcardDeck {
  id: string;
  student_id: string;
  topic_id: string | null;
  title: string;
  created_at: string;
}

export type FlashcardDifficulty = 'easy' | 'medium' | 'difficult';

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  difficulty: FlashcardDifficulty | null;
  is_starred: boolean;
  spaced_repetition_stage: number;
  next_review_at: string | null;
}

export interface LearningProgress {
  id: string;
  student_id: string;
  topic_id: string;
  mastery_score: number; // 0-100
  last_quiz_score: number | null;
  attempts_count: number;
  doubts_count: number;
  status: 'not_started' | 'in_progress' | 'completed';
  updated_at: string;
}

export interface Recommendation {
  id: string;
  student_id: string;
  topic_id: string;
  priority_score: number;
  reasons: string[];
  generated_at: string;
}

export interface StudyPlan {
  id: string;
  student_id: string;
  exam_name: string;
  exam_date: string;
  subjects: string[];
  available_hours_per_day: number;
  created_at: string;
}

export interface StudyTask {
  id: string;
  plan_id: string;
  date: string;
  topic_id: string | null;
  task_type: 'study' | 'revision' | 'mock_test';
  duration_minutes: number;
  is_completed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
}

export interface UserAchievement {
  id: string;
  student_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface TeacherReview {
  id: string;
  material_id: string;
  teacher_id: string;
  decision: 'approved' | 'rejected';
  comment: string | null;
  reviewed_at: string;
}

export interface ParentStudentLink {
  id: string;
  parent_profile_id: string;
  student_profile_id: string;
  consent_confirmed: boolean;
  linked_at: string;
}

// ─────────────────────────────────────────────────────────
// API response envelope used across all endpoints
// ─────────────────────────────────────────────────────────
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };
