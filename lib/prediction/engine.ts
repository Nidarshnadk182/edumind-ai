export interface PredictionSignals {
  quizAverage: number;
  masteryAverage: number;
  completionRate: number;
  attendanceRate?: number;
  revisionConsistency: number;
  confidenceAccuracyGap?: number;
  inactivityDays?: number;
  timedPracticeScore?: number;
}

export interface PredictionResult {
  expectedScore: number;
  scoreRange: { low: number; high: number };
  passProbability: number;
  readinessScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: Array<{ label: string; contribution: number; direction: 'positive' | 'negative' }>;
  disclaimer: string;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export function predictPerformance(signals: PredictionSignals): PredictionResult {
  const attendance = signals.attendanceRate ?? 80;
  const timedPractice = signals.timedPracticeScore ?? signals.quizAverage;
  const confidencePenalty = clamp(Math.abs(signals.confidenceAccuracyGap ?? 0), 0, 30);
  const inactivityPenalty = clamp((signals.inactivityDays ?? 0) * 1.5, 0, 20);

  const expectedScore = clamp(
    signals.quizAverage * 0.32 +
      signals.masteryAverage * 0.28 +
      signals.completionRate * 0.14 +
      attendance * 0.08 +
      signals.revisionConsistency * 0.1 +
      timedPractice * 0.08 -
      confidencePenalty * 0.12 -
      inactivityPenalty * 0.35
  );

  const uncertainty = clamp(
    15 - signals.revisionConsistency * 0.05 - signals.completionRate * 0.03 + confidencePenalty * 0.15,
    5,
    18
  );

  const passLogit =
    -3.2 +
    expectedScore * 0.065 +
    signals.completionRate * 0.008 +
    signals.revisionConsistency * 0.006 -
    inactivityPenalty * 0.025;

  const passProbability = clamp(sigmoid(passLogit) * 100);
  const readinessScore = clamp(
    signals.masteryAverage * 0.35 +
      signals.completionRate * 0.2 +
      signals.revisionConsistency * 0.2 +
      timedPractice * 0.25 -
      inactivityPenalty * 0.25
  );

  const riskLevel = passProbability >= 80 ? 'low' : passProbability >= 55 ? 'medium' : 'high';

  const factors: PredictionResult['factors'] = [
    { label: 'Quiz performance', contribution: Math.round(signals.quizAverage * 0.32), direction: 'positive' },
    { label: 'Concept mastery', contribution: Math.round(signals.masteryAverage * 0.28), direction: 'positive' },
    { label: 'Completion and revision', contribution: Math.round(signals.completionRate * 0.14 + signals.revisionConsistency * 0.1), direction: 'positive' },
  ];

  if (inactivityPenalty > 0) {
    factors.push({ label: 'Recent inactivity', contribution: -Math.round(inactivityPenalty * 0.35), direction: 'negative' });
  }
  if (confidencePenalty > 0) {
    factors.push({ label: 'Confidence–accuracy gap', contribution: -Math.round(confidencePenalty * 0.12), direction: 'negative' });
  }

  return {
    expectedScore: Math.round(expectedScore),
    scoreRange: {
      low: Math.round(clamp(expectedScore - uncertainty)),
      high: Math.round(clamp(expectedScore + uncertainty)),
    },
    passProbability: Math.round(passProbability),
    readinessScore: Math.round(readinessScore),
    riskLevel,
    factors,
    disclaimer: 'This is a readiness estimate based on available learning signals, not a guaranteed examination score.',
  };
}
