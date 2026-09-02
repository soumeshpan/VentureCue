import type { DiscoveryEvent } from './discovery';

export type SessionType = 'discovery' | 'pitch';

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export type Difficulty = 'easy' | 'moderate' | 'hard';

export interface TranscriptLine {
  id: string;
  speaker: 'user' | 'avatar';
  text: string;
  timestamp: number;
}

export interface SessionScore {
  overall: number;
  // Discovery-specific categories (0-100)
  discoveryQuality?: number;
  questionQuality?: number;
  listeningQuality?: number;
  followUpQuality?: number;
  evidenceGathering?: number;
  goalCoverage?: number;
  leadingQuestions?: number;   // count of leading questions detected
  prematurePitching?: number;  // count of premature pitches detected

  // Pitch-specific categories
  pitchClarity?: number;
  answerQuality?: number;
  businessUnderstanding?: number;
  marketUnderstanding?: number;
  tractionUnderstanding?: number;
  competitiveUnderstanding?: number;
  objectionHandling?: number;
  confidence?: number;
  conciseness?: number;
  consistency?: number;
}

export interface SessionMoment {
  id: string;
  type: 'strong' | 'weak';
  label: string;
  description: string;
  quote?: string;
  observedEvidence?: string;
  aiInterpretation?: string;
  actionableRecommendation?: string;
}

export interface MissedQuestion {
  id: string;
  customerStatement?: string;
  question: string;
  why: string;
}

export interface WeakAnswer {
  id: string;
  investorQuestion: string;
  founderAnswer: string;
  feedback: string;
  observedEvidence?: string;
  aiInterpretation?: string;
  actionableRecommendation?: string;
}

export interface LeadingQuestionFlag {
  id: string;
  founderQuote: string;
  issue: string;
  betterAlternative: string;
  observedEvidence?: string;
  aiInterpretation?: string;
}

export interface PrematurePitchFlag {
  id: string;
  founderQuote: string;
  context: string;
  reason: string;
  observedEvidence?: string;
  aiInterpretation?: string;
}

export interface SessionDebrief {
  score: SessionScore;
  strongMoments: SessionMoment[];
  weakMoments: SessionMoment[];
  missedQuestions?: MissedQuestion[];       // Discovery
  leadingQuestionFlags?: LeadingQuestionFlag[]; // Discovery
  prematurePitchFlags?: PrematurePitchFlag[];   // Discovery
  weakAnswers?: WeakAnswer[];               // Pitch
  redFlags?: string[];                       // Pitch
  unansweredQuestions?: string[];           // Pitch
  improvements: string[];
  questionsToAsk?: string[];                // Discovery
  strongestMoment?: SessionMoment;
  weakestMoment?: SessionMoment;
  recommendedNextStep?: string;
  summary: string;
  disclaimer?: string;
  validationReminder?: string;
}

export interface Session {
  id: string;
  type: SessionType;
  personaId: string;
  personaName: string;
  difficulty: Difficulty;
  startedAt: number;
  endedAt?: number;
  durationSeconds?: number;
  transcript: TranscriptLine[];
  events?: DiscoveryEvent[];
  debrief?: SessionDebrief;
  // Discovery context
  startupName?: string;
  selectedAssumptions?: string[];
  // Pitch context
  pitchTitle?: string;
}

export interface SessionConfig {
  sessionId: string;
  type: SessionType;
  personaId: string;
  difficulty: Difficulty;
  systemPrompt: string;
  context: Record<string, unknown>;
}
