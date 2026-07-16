// ─────────────────────────────────────────────────────────
// EduMind AI — Shared Zod validation schemas
// Every API route imports from here so validation stays
// consistent and typed end-to-end.
// ─────────────────────────────────────────────────────────
import { z } from 'zod';

export const userRoleSchema = z.enum(['student', 'teacher', 'parent', 'institution']);

export const studentOnboardingSchema = z.object({
  fullName: z.string().min(2).max(100),
  educationLevel: z.string().min(2).max(100),
  subjects: z.array(z.string()).min(1).max(10),
  learningGoals: z.string().max(500).optional().default(''),
  preferredLearningStyle: z.enum(['visual', 'auditory', 'reading_writing', 'kinesthetic']),
  preferredLanguage: z.string().min(2).max(10).default('en'),
  dailyStudyMinutes: z.number().int().min(5).max(600),
  examDate: z.string().date().optional().nullable(),
});

export const teacherOnboardingSchema = z.object({
  fullName: z.string().min(2).max(100),
  institution: z.string().max(150).optional().default(''),
  subjectsTaught: z.array(z.string()).min(1).max(10),
  gradeOrClass: z.string().max(50).optional().default(''),
  teachingObjectives: z.string().max(500).optional().default(''),
});

export const aiTutorMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional().nullable(),
  message: z.string().min(1).max(4000),
  mode: z
    .enum([
      'explain',
      'simplify',
      'example',
      'eli10',
      'beginner',
      'intermediate',
      'advanced',
      'practice_questions',
      'summarise',
      'follow_up',
    ])
    .optional()
    .default('explain'),
  responseLanguage: z.string().min(2).max(10).optional().default('en'),
});

export const notesGenerationSchema = z.object({
  sourceType: z.enum(['text', 'topic', 'upload']),
  sourceText: z.string().max(20000).optional(),
  topicId: z.string().uuid().optional(),
  uploadedFileId: z.string().uuid().optional(),
  length: z.enum(['short', 'detailed', 'exam_focused']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().min(2).max(10).default('en'),
});

export const quizGenerationSchema = z.object({
  sourceType: z.enum(['topic', 'notes', 'upload', 'ai_conversation', 'pasted_text']),
  subjectName: z.string().min(2).max(150),
  subjectCode: z.string().min(2).max(30).optional(),
  topicName: z.string().min(2).max(200),
  subtopics: z.array(z.string().min(1).max(150)).max(20).optional().default([]),
  learningOutcome: z.string().min(5).max(500),
  sourceText: z.string().max(30000).optional(),
  topicId: z.string().uuid().optional(),
  notesId: z.string().uuid().optional(),
  uploadedFileId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  questionTypes: z.array(z.enum(['mcq', 'true_false', 'short_answer', 'numerical'])).min(1),
  numQuestions: z.number().int().min(1).max(30),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  difficultyDistribution: z.object({
    recall: z.number().min(0).max(100),
    understanding: z.number().min(0).max(100),
    application: z.number().min(0).max(100),
    analysis: z.number().min(0).max(100),
    evaluation: z.number().min(0).max(100),
  }).refine((v) => Object.values(v).reduce((a, b) => a + b, 0) === 100, 'Difficulty distribution must total 100'),
  relyOnlyOnProvidedMaterial: z.boolean().default(true),
  timeLimitMinutes: z.number().int().min(1).max(180).optional(),
});

export const quizSubmissionSchema = z.object({
  quizId: z.string().uuid(),
  timeTakenSeconds: z.number().int().min(0),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        studentAnswer: z.string().max(2000),
      })
    )
    .min(1),
});

export const flashcardGenerationSchema = z.object({
  sourceType: z.enum(['topic', 'notes', 'manual']),
  topicId: z.string().uuid().optional(),
  notesId: z.string().uuid().optional(),
  deckTitle: z.string().min(1).max(150),
  count: z.number().int().min(1).max(50).optional().default(10),
  cards: z
    .array(z.object({ front: z.string().min(1).max(500), back: z.string().min(1).max(1000) }))
    .optional(),
});

export const studyPlanGenerationSchema = z.object({
  examName: z.string().min(1).max(150),
  examDate: z.string().date(),
  subjects: z.array(z.string()).min(1).max(10),
  chapters: z.array(z.string()).optional().default([]),
  availableHoursPerDay: z.number().min(0.5).max(16),
  daysUnavailable: z.array(z.string().date()).optional().default([]),
  preferredSessionLength: z.number().int().min(15).max(240).optional().default(45),
});

export const classCreateSchema = z.object({
  name: z.string().min(2).max(100),
  subjectId: z.string().uuid(),
});

export const classJoinSchema = z.object({
  classCode: z.string().min(4).max(12),
});

export const contentReviewSchema = z.object({
  materialId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'revision_requested']),
  recipientType: z.enum(['student', 'class']).optional(),
  recipientIds: z.array(z.string().uuid()).max(100).optional().default([]),
  comment: z.string().max(1000).optional(),
});

export const fileUploadMetadataSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]),
  sizeBytes: z.number().int().min(1).max(20 * 1024 * 1024), // 20MB cap
});
