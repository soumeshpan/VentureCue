/**
 * VentureCue — Human Review & Verification Types
 * Defines the immutable audit chain: AI Diagnosis -> Human Review -> Final Evaluation.
 */

import type { SessionDebrief, SessionType, Difficulty } from './session';

export type ReviewStatus = 'PENDING' | 'ACCEPTED' | 'EDITED' | 'REJECTED';

export type ReviewerDecision = 'ACCEPT' | 'EDIT' | 'REJECT';

export interface EditedField {
  field: string;
  label: string;
  originalValue: unknown;
  newValue: unknown;
  reason?: string;
}

export type EvidenceStatus = 'verified' | 'disputed' | 'modified';

export interface EvidenceItem {
  id: string;
  findingId: string;
  findingType: 'leading_question' | 'premature_pitch' | 'strong_moment' | 'weak_moment' | 'missed_opportunity' | 'weak_answer';
  findingText: string;
  quote?: string;
  transcriptLineId?: string;
  status: EvidenceStatus;
  disputeNote?: string;
}

export interface AuditEntry {
  id: string;
  reviewId: string;
  sessionId: string;
  action: 'CREATED' | 'ACCEPTED' | 'EDITED' | 'REJECTED';
  reviewerId: string;
  reviewerName: string;
  timestamp: number;
  changedFields?: EditedField[];
  reason?: string;
}

export interface HumanReview {
  id: string;
  sessionId: string;
  sessionType: SessionType;
  startupName: string;
  personaName: string;
  difficulty: Difficulty;
  reviewStatus: ReviewStatus;
  reviewerId: string;
  reviewerName: string;
  createdAt: number;
  reviewedAt?: number;

  // The original AI evaluation snapshot — MUST NEVER BE MUTATED
  originalEvaluation: SessionDebrief;

  // The active / finalized evaluation used by downstream dashboards & reports
  finalEvaluation: SessionDebrief;

  reviewerDecision?: ReviewerDecision;
  reviewerNotes?: string;
  rejectionReason?: string;

  editedFields: EditedField[];
  evidenceItems: EvidenceItem[];
  auditTrail: AuditEntry[];

  aiVersion: string;
  reviewVersion: number;
  isDemo?: boolean;
}

export interface ReviewFilterOptions {
  status: 'ALL' | ReviewStatus;
  sessionType: 'ALL' | SessionType;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'score_asc' | 'score_desc';
}
