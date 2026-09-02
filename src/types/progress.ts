/**
 * VentureCue — Progress & Performance Analytics Data Models
 * Types for multi-session trend tracking, recurring weakness detection, and personalized coaching recommendations.
 */

import type { Difficulty } from './session';
import type { ReviewStatus } from './review';

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';

export interface SkillProgressPoint {
  sessionId: string;
  sessionDate: number;
  score: number;
  provenance: 'HUMAN_REVIEWED' | 'HUMAN_EDITED' | 'AI_PROVISIONAL' | 'AI_REJECTED';
}

export interface SkillTrend {
  skillKey: string;
  label: string;
  module: 'discovery' | 'pitch';
  currentScore: number;
  previousScore?: number;
  change: number;
  averageScore: number;
  trend: TrendDirection;
  dataPointsCount: number;
  history: SkillProgressPoint[];
}

export interface RecurringWeakness {
  id: string;
  category: 'discovery' | 'pitch';
  title: string;
  description: string;
  frequency: number; // e.g. 4 out of 6 sessions
  totalSessionsEvaluated: number;
  occurrences: number[]; // e.g. [7, 5, 3, 1] counts over time
  status: 'RECURRING' | 'EMERGING' | 'ISOLATED';
  trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING';
  recommendedPractice: string;
  recommendedPersonaId?: string;
  recommendedDifficulty?: Difficulty;
}

export interface StrengthHighlight {
  id: string;
  title: string;
  description: string;
  averageScore: number;
  growthDelta: number;
  consistencyScore: number; // 0-100
}

export interface PersonaPerformance {
  personaId: string;
  personaName: string;
  module: 'discovery' | 'pitch';
  sessionsCount: number;
  averageScore: number;
  latestScore: number;
  difficultyLevels: Difficulty[];
  keyObservation: string;
}

export interface NextPracticeRecommendation {
  module: 'discovery' | 'pitch';
  personaId: string;
  personaName: string;
  targetDifficulty: Difficulty;
  primaryFocus: string;
  rationale: string;
  targetSkill: string;
  suggestedAction: string;
}

export interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  achievedAt: number;
  category: 'milestone' | 'skill_breakthrough' | 'consistency';
}

export interface FounderProgressReport {
  totalSessions: number;
  discoverySessionsCount: number;
  pitchSessionsCount: number;
  humanReviewedCount: number;
  aiOnlyCount: number;
  rejectedCount: number;

  overallAverageScore: number;
  latestOverallScore?: number;
  overallScoreTrend: TrendDirection;
  overallScoreChange: number;

  strongestSkill?: { label: string; score: number };
  weakestSkill?: { label: string; score: number };

  discoverySkills: SkillTrend[];
  pitchSkills: SkillTrend[];

  recurringWeaknesses: RecurringWeakness[];
  topStrengths: StrengthHighlight[];
  personaBreakdowns: PersonaPerformance[];
  milestones: ProgressMilestone[];

  personalizedCoachingSummary: string;
  nextPracticeRecommendation: NextPracticeRecommendation;

  dataSufficiency: 'ZERO_SESSIONS' | 'SINGLE_SESSION' | 'PRELIMINARY' | 'ROBUST';
  dataSufficiencyNote: string;
}
