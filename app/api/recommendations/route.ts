import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { scoreTopics, type TopicSignal } from '@/lib/recommendations/engine';
import { DEMO_TOPICS, DEMO_PROGRESS } from '@/lib/database/demo-data';
import { isSupabaseConfigured, createSupabaseServerClient } from '@/lib/database/supabase-server';
import type { ApiResponse } from '@/types/database';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  }

  let signals: TopicSignal[];

  if (!isSupabaseConfigured()) {
    signals = DEMO_PROGRESS.map((p) => {
      const topic = DEMO_TOPICS.find((t) => t.id === p.topic_id)!;
      return {
        topicId: topic.id,
        topicName: topic.name,
        masteryScore: p.mastery_score,
        lastQuizScore: p.last_quiz_score,
        doubtsCount: p.doubts_count,
        isIncomplete: p.status !== 'completed',
        isExamRelevant: true,
      };
    });
  } else {
    const supabase = createSupabaseServerClient();
    const { data: progress } = await supabase
      .from('learning_progress')
      .select('*, topics(name)')
      .eq('student_id', session.id);

    signals = (progress ?? []).map((p: any) => ({
      topicId: p.topic_id,
      topicName: p.topics?.name ?? 'Unknown topic',
      masteryScore: p.mastery_score,
      lastQuizScore: p.last_quiz_score,
      doubtsCount: p.doubts_count,
      isIncomplete: p.status !== 'completed',
      isExamRelevant: true,
    }));
  }

  const results = scoreTopics(signals);
  return NextResponse.json<ApiResponse<typeof results>>({ success: true, data: results });
}
