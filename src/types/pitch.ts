import type { Difficulty } from './session';

export interface PitchInfo {
  startupName: string;
  problem: string;
  solution: string;
  targetMarket: string;
  businessModel: string;
  competition: string;
  differentiation: string;
  traction: string;
  growth: string;
  financials: string;
  fundingRequired: string;
  useOfFunds: string;
}

export interface PitchConcern {
  id: string;
  area: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PitchStrength {
  id: string;
  area: string;
  description: string;
}

export interface PitchAnalysis {
  strengths: PitchStrength[];
  concerns: PitchConcern[];
  missingInfo: string[];
  claimsNeedingEvidence: string[];
  likelyQuestionAreas: string[];
}

export interface PitchSetup {
  id: string;
  info: Partial<PitchInfo>;
  deckFileName?: string;
  analysis?: PitchAnalysis;
  personaId: string;
  difficulty: Difficulty;
  createdAt: number;
}

export type PitchWizardStep = 1 | 2 | 3;
