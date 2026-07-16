// ─────────────────────────────────────────────────────────
// EduMind AI — Demo-mode mock data
// Used whenever Supabase credentials are absent OR
// DEMO_MODE=true. Mirrors supabase/seed.sql so the UI looks
// identical in demo mode and in a fully configured environment.
// This is clearly-labelled mock data, not live database content.
// ─────────────────────────────────────────────────────────

import type {
  Subject,
  Topic,
  LearningProgress,
  Quiz,
  FlashcardDeck,
  Flashcard,
  Recommendation,
  AiConversation,
  AiMessage,
} from '@/types/database';

export const DEMO_STUDENT = {
  id: '55555555-5555-5555-5555-555555555501',
  profileId: '44444444-4444-4444-4444-444444444401',
  fullName: 'Demo MBA Student',
  educationLevel: 'MBA - Finance',
  streakDays: 6,
  longestStreak: 14,
  xpPoints: 1280,
  weeklyLearningMinutes: 340,
  averageQuizScore: 78,
  examDate: addDays(45),
};

export const DEMO_SUBJECTS: Subject[] = [
  { id: '11111111-1111-1111-1111-111111111101', name: 'Corporate Finance', slug: 'corporate-finance', description: 'Capital budgeting, valuation, capital structure' },
  { id: '11111111-1111-1111-1111-111111111102', name: 'Derivatives', slug: 'derivatives', description: 'Futures, options, swaps and risk management' },
  { id: '11111111-1111-1111-1111-111111111103', name: 'Strategic Management', slug: 'strategic-management', description: 'Competitive strategy and organisational analysis' },
  { id: '11111111-1111-1111-1111-111111111104', name: 'Econometrics', slug: 'econometrics', description: 'Regression analysis and statistical inference for economics' },
];

export const DEMO_TOPICS: Topic[] = [
  { id: '22222222-2222-2222-2222-222222222201', subject_id: '11111111-1111-1111-1111-111111111102', name: 'Option Greeks', slug: 'option-greeks', difficulty: 'advanced', order_index: 1 },
  { id: '22222222-2222-2222-2222-222222222202', subject_id: '11111111-1111-1111-1111-111111111102', name: 'Put-Call Parity', slug: 'put-call-parity', difficulty: 'intermediate', order_index: 2 },
  { id: '22222222-2222-2222-2222-222222222203', subject_id: '11111111-1111-1111-1111-111111111101', name: 'Weighted Average Cost of Capital', slug: 'wacc', difficulty: 'intermediate', order_index: 1 },
  { id: '22222222-2222-2222-2222-222222222204', subject_id: '11111111-1111-1111-1111-111111111101', name: 'Net Present Value', slug: 'npv', difficulty: 'beginner', order_index: 2 },
  { id: '22222222-2222-2222-2222-222222222205', subject_id: '11111111-1111-1111-1111-111111111103', name: "Porter's Five Forces", slug: 'five-forces', difficulty: 'beginner', order_index: 1 },
  { id: '22222222-2222-2222-2222-222222222206', subject_id: '11111111-1111-1111-1111-111111111104', name: 'Multiple Linear Regression', slug: 'multiple-regression', difficulty: 'advanced', order_index: 1 },
  { id: '22222222-2222-2222-2222-222222222207', subject_id: '11111111-1111-1111-1111-111111111104', name: 'Heteroskedasticity', slug: 'heteroskedasticity', difficulty: 'advanced', order_index: 2 },
];

export const DEMO_PROGRESS: LearningProgress[] = [
  { id: 'p1', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222201', mastery_score: 42, last_quiz_score: 55, attempts_count: 3, doubts_count: 4, status: 'in_progress', updated_at: hoursAgo(6) },
  { id: 'p2', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222202', mastery_score: 78, last_quiz_score: 82, attempts_count: 2, doubts_count: 1, status: 'in_progress', updated_at: hoursAgo(20) },
  { id: 'p3', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222203', mastery_score: 88, last_quiz_score: 90, attempts_count: 4, doubts_count: 0, status: 'completed', updated_at: hoursAgo(48) },
  { id: 'p4', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222204', mastery_score: 95, last_quiz_score: 96, attempts_count: 3, doubts_count: 0, status: 'completed', updated_at: hoursAgo(72) },
  { id: 'p5', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222205', mastery_score: 66, last_quiz_score: 70, attempts_count: 2, doubts_count: 1, status: 'in_progress', updated_at: hoursAgo(30) },
  { id: 'p6', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222206', mastery_score: 35, last_quiz_score: 40, attempts_count: 2, doubts_count: 5, status: 'in_progress', updated_at: hoursAgo(3) },
  { id: 'p7', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222207', mastery_score: 20, last_quiz_score: null, attempts_count: 0, doubts_count: 2, status: 'not_started', updated_at: hoursAgo(96) },
];

export const DEMO_RECOMMENDATIONS: Recommendation[] = [
  { id: 'r1', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222206', priority_score: 91, reasons: ['Low quiz score (40%)', 'High doubt count (5 doubts logged)', 'Advanced difficulty with low mastery'], generated_at: hoursAgo(1) },
  { id: 'r2', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222201', priority_score: 84, reasons: ['Mastery below 50%', 'Repeated doubts on this topic', 'Frequently tested in Derivatives exams'], generated_at: hoursAgo(1) },
  { id: 'r3', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222207', priority_score: 62, reasons: ['Not started yet', 'Upcoming exam includes this chapter'], generated_at: hoursAgo(1) },
];

export const DEMO_QUIZZES: Quiz[] = [
  { id: 'q1', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222201', title: 'Option Greeks — Practice Quiz', difficulty: 'advanced', time_limit_minutes: 15, source: 'topic', created_at: hoursAgo(6) },
  { id: 'q2', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222203', title: 'WACC — Concept Check', difficulty: 'intermediate', time_limit_minutes: 10, source: 'notes', created_at: hoursAgo(48) },
];

export const DEMO_FLASHCARD_DECKS: FlashcardDeck[] = [
  { id: 'd1', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222202', title: 'Put-Call Parity Essentials', created_at: hoursAgo(20) },
  { id: 'd2', student_id: DEMO_STUDENT.id, topic_id: '22222222-2222-2222-2222-222222222205', title: "Porter's Five Forces", created_at: hoursAgo(30) },
];

export const DEMO_FLASHCARDS: Flashcard[] = [
  { id: 'f1', deck_id: 'd1', front: 'State the put-call parity formula.', back: 'C + PV(K) = P + S, where C = call price, P = put price, K = strike, S = spot price.', difficulty: 'medium', is_starred: true, spaced_repetition_stage: 2, next_review_at: addDays(2) },
  { id: 'f2', deck_id: 'd1', front: 'What does a violation of put-call parity imply?', back: 'An arbitrage opportunity exists between the option and underlying/bond positions.', difficulty: 'difficult', is_starred: false, spaced_repetition_stage: 1, next_review_at: addDays(1) },
  { id: 'f3', deck_id: 'd2', front: 'Name the five forces in Porter\u2019s framework.', back: 'Threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitutes, industry rivalry.', difficulty: 'easy', is_starred: true, spaced_repetition_stage: 3, next_review_at: addDays(5) },
];

export const DEMO_CONVERSATION: AiConversation = {
  id: 'c1',
  student_id: DEMO_STUDENT.id,
  topic_id: '22222222-2222-2222-2222-222222222201',
  title: 'Understanding Delta and Gamma',
  created_at: hoursAgo(6),
  updated_at: hoursAgo(6),
};

export const DEMO_MESSAGES: AiMessage[] = [
  { id: 'm1', conversation_id: 'c1', role: 'user', content: 'Can you explain what Delta means for an option, simply?', is_demo_response: false, created_at: hoursAgo(6) },
  {
    id: 'm2',
    conversation_id: 'c1',
    role: 'assistant',
    content:
      "Delta measures how much an option's price is expected to move for a ₹1 change in the underlying asset's price. A call option delta ranges from 0 to 1 — a delta of 0.6 means the option price moves about ₹0.60 for every ₹1 move in the stock. Think of it as a rough proxy for the probability the option finishes in-the-money.",
    is_demo_response: true,
    created_at: hoursAgo(6),
  },
];

export const DEMO_WEEKLY_ACTIVITY = [
  { day: 'Mon', minutes: 40 },
  { day: 'Tue', minutes: 55 },
  { day: 'Wed', minutes: 30 },
  { day: 'Thu', minutes: 65 },
  { day: 'Fri', minutes: 45 },
  { day: 'Sat', minutes: 70 },
  { day: 'Sun', minutes: 35 },
];

export const DEMO_SUBJECT_MASTERY = [
  { subject: 'Corporate Finance', mastery: 91 },
  { subject: 'Derivatives', mastery: 58 },
  { subject: 'Strategic Mgmt', mastery: 66 },
  { subject: 'Econometrics', mastery: 28 },
];

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}
function addDays(d: number): string {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
