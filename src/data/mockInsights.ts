export interface InsightMetric {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'flat';
  change: number; // percentage points
}

export interface RecurringWeakness {
  id: string;
  label: string;
  description: string;
  occurrences: number;
  sessions: string[];
}

export interface ScoreDataPoint {
  sessionId: string;
  date: number;
  type: 'discovery' | 'pitch';
  overall: number;
}

export interface MockInsightsData {
  totalSessions: number;
  totalDiscoverySessions: number;
  totalPitchSessions: number;
  averageOverallScore: number;
  scoreHistory: ScoreDataPoint[];
  discoveryMetrics: InsightMetric[];
  pitchMetrics: InsightMetric[];
  recurringWeaknesses: RecurringWeakness[];
  improvements: string[];
  recommendedNextAction: string;
}

export const mockInsights: MockInsightsData = {
  totalSessions: 3,
  totalDiscoverySessions: 2,
  totalPitchSessions: 1,
  averageOverallScore: 70,
  scoreHistory: [
    { sessionId: 'sess-003', date: Date.now() - 1000 * 60 * 60 * 24 * 7, type: 'discovery', overall: 78 },
    { sessionId: 'sess-002', date: Date.now() - 1000 * 60 * 60 * 24 * 5, type: 'pitch', overall: 71 },
    { sessionId: 'sess-001', date: Date.now() - 1000 * 60 * 60 * 24 * 2, type: 'discovery', overall: 62 },
  ],
  discoveryMetrics: [
    { label: 'Discovery Quality', value: 69, trend: 'down', change: -11 },
    { label: 'Question Quality', value: 66, trend: 'down', change: -10 },
    { label: 'Listening Quality', value: 76, trend: 'down', change: -7 },
    { label: 'Follow-up Quality', value: 68, trend: 'down', change: -8 },
  ],
  pitchMetrics: [
    { label: 'Pitch Clarity', value: 75, trend: 'flat', change: 0 },
    { label: 'Answer Quality', value: 68, trend: 'flat', change: 0 },
    { label: 'Objection Handling', value: 65, trend: 'flat', change: 0 },
    { label: 'Confidence', value: 78, trend: 'flat', change: 0 },
  ],
  recurringWeaknesses: [
    {
      id: 'rw1',
      label: 'Leading questions',
      description: 'You consistently ask questions that suggest the answer rather than letting customers reveal their own reality.',
      occurrences: 2,
      sessions: ['sess-001', 'sess-003'],
    },
    {
      id: 'rw2',
      label: 'Vague metric definitions',
      description: 'When discussing traction, you use terms like "active users" without defining what active means.',
      occurrences: 1,
      sessions: ['sess-002'],
    },
  ],
  improvements: [
    'Your follow-up question quality improved by 8% between your first and second discovery sessions.',
    'You successfully avoided premature pitching in your most recent discovery session.',
  ],
  recommendedNextAction:
    'Practice a discovery session with The Skeptic persona at Hard difficulty to address your leading question habit.',
};
