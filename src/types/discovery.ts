import type { Difficulty } from './session';

export type AssumptionCategory = 'problem' | 'customer' | 'behavior' | 'market' | 'solution';

export interface Assumption {
  id: string;
  statement: string;
  category: AssumptionCategory;
  whyItMatters: string;
  evidenceNeeded: string;
  validationStatus: 'unvalidated' | 'partially_validated' | 'validated' | 'invalidated';
  selected: boolean;
}

export type DocumentUploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

export interface DocumentUploadState {
  status: DocumentUploadStatus;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  progress: number;
  extractedSummary?: string;
  errorMessage?: string;
}

export interface DiscoveryContext {
  startupName: string;
  whatBuilding: string;
  targetCustomer: string;
  problemHypothesis: string;
  currentSolution?: string;
  currentAssumptions?: string;
  currentBeliefs?: string;
  documentName?: string;
  documentContent?: string;
  documentUpload?: DocumentUploadState;
}

export interface DiscoverySetup {
  id: string;
  context: DiscoveryContext;
  assumptions: Assumption[];
  personaId: string;
  difficulty: Difficulty;
  createdAt: number;
}

export type DiscoveryWizardStep = 1 | 2 | 3 | 4;

export type DiscoveryEventType =
  | 'session_started'
  | 'question_asked'
  | 'follow_up_question'
  | 'leading_question'
  | 'open_question'
  | 'closed_question'
  | 'premature_pitch'
  | 'asked_about_past_behavior'
  | 'asked_about_current_workflow'
  | 'asked_about_frequency'
  | 'asked_about_impact'
  | 'asked_about_current_solution'
  | 'layer_unlocked'
  | 'customer_signal'
  | 'missed_opportunity'
  | 'session_ended';

export interface DiscoveryEvent {
  id: string;
  type: DiscoveryEventType;
  timestamp: number;
  transcriptLineId?: string;
  note: string;
  quote?: string;
  metadata?: Record<string, unknown>;
}

export interface CustomerInternalState {
  trustLevel: number; // 0 to 100
  engagementLevel: number; // 0 to 100
  patienceLevel: number; // 0 to 100
  revealedLayer: number; // 1 to 6
  revealedFacts: string[];
  knownTools: string[];
  founderPitchesCount: number;
  leadingQuestionsCount: number;
  goodQuestionsCount: number;
  lastTopic: string;
  discoveredPain: boolean;
  discoveredConsequence: boolean;
  discoveredSwitchingBarrier: boolean;
  contradictionsInvestigated: boolean;
}
