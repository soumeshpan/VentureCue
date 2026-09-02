import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  HumanReview,
  ReviewStatus,
  EditedField,
  EvidenceItem,
  EvidenceStatus,
  AuditEntry,
} from '../types/review';
import type { SessionDebrief, SessionType, Difficulty } from '../types/session';

interface ReviewStoreState {
  reviews: HumanReview[];
  activeReviewId: string | null;

  // Actions
  clearAllReviews: () => void;
  createPendingReview: (params: {
    sessionId: string;
    sessionType: SessionType;
    startupName: string;
    personaName: string;
    difficulty: Difficulty;
    evaluation: SessionDebrief;
  }) => HumanReview;

  getReviewById: (id: string) => HumanReview | undefined;
  getReviewBySessionId: (sessionId: string) => HumanReview | undefined;

  acceptReview: (params: {
    reviewId: string;
    reviewerId: string;
    reviewerName: string;
    notes?: string;
  }) => HumanReview | null;

  editReview: (params: {
    reviewId: string;
    reviewerId: string;
    reviewerName: string;
    updatedEvaluation: SessionDebrief;
    editedFields: EditedField[];
    notes: string;
    evidenceItems?: EvidenceItem[];
  }) => HumanReview | null;

  rejectReview: (params: {
    reviewId: string;
    reviewerId: string;
    reviewerName: string;
    rejectionReason: string;
    notes?: string;
  }) => HumanReview | null;

  updateEvidenceStatus: (params: {
    reviewId: string;
    evidenceId: string;
    status: EvidenceStatus;
    disputeNote?: string;
  }) => void;

  deleteReviewBySessionId: (sessionId: string) => void;
}

export const useReviewStore = create<ReviewStoreState>()(
  persist(
    (set, get) => ({
      reviews: [],
      activeReviewId: null,

      clearAllReviews: () => {
        set({ reviews: [], activeReviewId: null });
      },

      createPendingReview: ({
        sessionId,
        sessionType,
        startupName,
        personaName,
        difficulty,
        evaluation,
      }) => {
        // Deep clone original evaluation to enforce immutability
        const originalEvaluationSnapshot = JSON.parse(JSON.stringify(evaluation)) as SessionDebrief;
        const reviewId = `rev-${sessionId}-${Date.now()}`;

        // Build evidence item links from debrief signals
        const evidenceItems: EvidenceItem[] = [];

        if (evaluation.leadingQuestionFlags) {
          evaluation.leadingQuestionFlags.forEach((flag, idx) => {
            evidenceItems.push({
              id: `ev-lead-${idx}`,
              findingId: flag.id,
              findingType: 'leading_question',
              findingText: `Leading question: ${flag.issue}`,
              quote: flag.founderQuote,
              status: 'verified',
            });
          });
        }

        if (evaluation.prematurePitchFlags) {
          evaluation.prematurePitchFlags.forEach((flag, idx) => {
            evidenceItems.push({
              id: `ev-pitch-${idx}`,
              findingId: flag.id,
              findingType: 'premature_pitch',
              findingText: `Premature pitch: ${flag.reason}`,
              quote: flag.founderQuote,
              status: 'verified',
            });
          });
        }

        if (evaluation.strongMoments) {
          evaluation.strongMoments.forEach((sm, idx) => {
            if (sm.quote) {
              evidenceItems.push({
                id: `ev-sm-${idx}`,
                findingId: sm.id,
                findingType: 'strong_moment',
                findingText: sm.label,
                quote: sm.quote,
                status: 'verified',
              });
            }
          });
        }

        if (evaluation.weakMoments) {
          evaluation.weakMoments.forEach((wm, idx) => {
            if (wm.quote) {
              evidenceItems.push({
                id: `ev-wm-${idx}`,
                findingId: wm.id,
                findingType: 'weak_moment',
                findingText: wm.label,
                quote: wm.quote,
                status: 'verified',
              });
            }
          });
        }

        if (evaluation.weakAnswers) {
          evaluation.weakAnswers.forEach((wa, idx) => {
            evidenceItems.push({
              id: `ev-wa-${idx}`,
              findingId: wa.id,
              findingType: 'weak_answer',
              findingText: `Question: ${wa.investorQuestion} — ${wa.feedback}`,
              quote: wa.founderAnswer,
              status: 'verified',
            });
          });
        }

        const initialAudit: AuditEntry = {
          id: `aud-init-${Date.now()}`,
          reviewId,
          sessionId,
          action: 'CREATED',
          reviewerId: 'system-ai',
          reviewerName: 'VentureCue AI Diagnostic Engine v2.4',
          timestamp: Date.now(),
          reason: 'Session finished. Auto-generated initial AI diagnosis awaiting human verification.',
        };

        const newReview: HumanReview = {
          id: reviewId,
          sessionId,
          sessionType,
          startupName: startupName || 'Your Startup',
          personaName,
          difficulty,
          reviewStatus: 'PENDING',
          reviewerId: '',
          reviewerName: '',
          createdAt: Date.now(),
          originalEvaluation: originalEvaluationSnapshot,
          finalEvaluation: JSON.parse(JSON.stringify(originalEvaluationSnapshot)),
          editedFields: [],
          evidenceItems,
          auditTrail: [initialAudit],
          aiVersion: 'v2.4-hybrid-engine',
          reviewVersion: 1,
        };

        set((state) => ({
          reviews: [newReview, ...state.reviews.filter((r) => r.sessionId !== sessionId)],
        }));

        return newReview;
      },

      getReviewById: (id: string) => get().reviews.find((r) => r.id === id),

      getReviewBySessionId: (sessionId: string) =>
        get().reviews.find((r) => r.sessionId === sessionId),

      acceptReview: ({ reviewId, reviewerId, reviewerName, notes }) => {
        const review = get().reviews.find((r) => r.id === reviewId);
        if (!review) return null;

        const auditEntry: AuditEntry = {
          id: `aud-acc-${Date.now()}`,
          reviewId,
          sessionId: review.sessionId,
          action: 'ACCEPTED',
          reviewerId,
          reviewerName,
          timestamp: Date.now(),
          reason: notes || 'Accepted AI diagnosis without modifications.',
        };

        const updated: HumanReview = {
          ...review,
          reviewStatus: 'ACCEPTED',
          reviewerId,
          reviewerName,
          reviewedAt: Date.now(),
          reviewerDecision: 'ACCEPT',
          reviewerNotes: notes,
          // finalEvaluation matches original exactly
          finalEvaluation: JSON.parse(JSON.stringify(review.originalEvaluation)),
          auditTrail: [...review.auditTrail, auditEntry],
          reviewVersion: review.reviewVersion + 1,
        };

        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === reviewId ? updated : r)),
        }));

        return updated;
      },

      editReview: ({
        reviewId,
        reviewerId,
        reviewerName,
        updatedEvaluation,
        editedFields,
        notes,
        evidenceItems,
      }) => {
        const review = get().reviews.find((r) => r.id === reviewId);
        if (!review) return null;

        const auditEntry: AuditEntry = {
          id: `aud-edit-${Date.now()}`,
          reviewId,
          sessionId: review.sessionId,
          action: 'EDITED',
          reviewerId,
          reviewerName,
          timestamp: Date.now(),
          changedFields: editedFields,
          reason: notes || 'Updated evaluation scores and findings based on transcript evidence.',
        };

        const updated: HumanReview = {
          ...review,
          reviewStatus: 'EDITED',
          reviewerId,
          reviewerName,
          reviewedAt: Date.now(),
          reviewerDecision: 'EDIT',
          reviewerNotes: notes,
          // Immutable original preserved, finalEvaluation receives human updates
          finalEvaluation: JSON.parse(JSON.stringify(updatedEvaluation)),
          editedFields,
          evidenceItems: evidenceItems || review.evidenceItems,
          auditTrail: [...review.auditTrail, auditEntry],
          reviewVersion: review.reviewVersion + 1,
        };

        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === reviewId ? updated : r)),
        }));

        return updated;
      },

      rejectReview: ({ reviewId, reviewerId, reviewerName, rejectionReason, notes }) => {
        const review = get().reviews.find((r) => r.id === reviewId);
        if (!review) return null;

        const auditEntry: AuditEntry = {
          id: `aud-rej-${Date.now()}`,
          reviewId,
          sessionId: review.sessionId,
          action: 'REJECTED',
          reviewerId,
          reviewerName,
          timestamp: Date.now(),
          reason: rejectionReason,
        };

        const updated: HumanReview = {
          ...review,
          reviewStatus: 'REJECTED',
          reviewerId,
          reviewerName,
          reviewedAt: Date.now(),
          reviewerDecision: 'REJECT',
          rejectionReason,
          reviewerNotes: notes,
          auditTrail: [...review.auditTrail, auditEntry],
          reviewVersion: review.reviewVersion + 1,
        };

        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === reviewId ? updated : r)),
        }));

        return updated;
      },

      updateEvidenceStatus: ({ reviewId, evidenceId, status, disputeNote }) => {
        set((state) => ({
          reviews: state.reviews.map((r) => {
            if (r.id !== reviewId) return r;
            return {
              ...r,
              evidenceItems: r.evidenceItems.map((ev) =>
                ev.id === evidenceId
                  ? { ...ev, status, disputeNote: disputeNote || ev.disputeNote }
                  : ev
              ),
            };
          }),
        }));
      },

      deleteReviewBySessionId: (sessionId: string) => {
        set((state) => ({
          reviews: state.reviews.filter((r) => r.sessionId !== sessionId),
        }));
      },
    }),
    {
      name: 'venturecue-human-reviews',
      version: 2,
      migrate: (persistedState: any) => {
        if (persistedState && Array.isArray(persistedState.reviews)) {
          return {
            ...persistedState,
            reviews: persistedState.reviews.filter(
              (r: any) =>
                r.sessionId &&
                !r.sessionId.startsWith('sess-') &&
                !r.sessionId.startsWith('mock-') &&
                !r.id.startsWith('rev-mock-')
            ),
          };
        }
        return persistedState;
      },
    }
  )
);
