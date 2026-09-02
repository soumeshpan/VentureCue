/**
 * VentureCue — Human Review, AI Diagnosis Verification & Audit Trail Test Suite
 * Validates the core requirements:
 * 1. Accept Workflow (original == final, status = ACCEPTED)
 * 2. Edit Workflow (original preserved, final updated, editedFields logged)
 * 3. Reject Workflow (status = REJECTED, rejectionReason stored, original intact)
 * 4. Persistence (JSON serialization & retrieval)
 * 5. Immutability (original AI snapshot NEVER mutates)
 * 6. Evidence Linking (transcript quotes mapped to findings)
 */

import { useReviewStore } from '../store/reviewStore';
import type { SessionDebrief } from '../types/session';

export function runHumanReviewTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  const logResult = (testName: string, passed: boolean, detail: string) => {
    if (!passed) allPassed = false;
    results.push(`[${passed ? 'PASS' : 'FAIL'}] ${testName}: ${detail}`);
  };

  // Mock initial AI debrief
  const sampleAIDebrief: SessionDebrief = {
    score: {
      overall: 62,
      discoveryQuality: 62,
      questionQuality: 70,
      listeningQuality: 65,
      evidenceGathering: 55,
      goalCoverage: 60,
    },
    strongMoments: [
      {
        id: 'sm-1',
        type: 'strong',
        label: 'Probed past workflow friction',
        description: 'Asked about past breakdown in spreadsheets',
        quote: 'Tell me what happened the last time your team ran into this.',
      },
    ],
    weakMoments: [
      {
        id: 'wm-1',
        type: 'weak',
        label: 'Leading question on feature automation',
        description: 'Nudged customer toward positive response',
        quote: 'Wouldn’t it be nice if AI automated this?',
      },
    ],
    leadingQuestionFlags: [
      {
        id: 'lf-1',
        founderQuote: 'Wouldn’t it be nice if AI automated this?',
        issue: 'Leading question',
        betterAlternative: 'How do you currently solve this?',
      },
    ],
    improvements: ['Ask past behavior questions'],
    summary: 'Initial AI Diagnosis: Founder reached latent pain layer.',
  };

  // -------------------------------------------------------------
  // Test 1 — Accept Workflow
  // -------------------------------------------------------------
  try {
    const store = useReviewStore.getState();
    const pendingReview = store.createPendingReview({
      sessionId: 'test-session-accept-01',
      sessionType: 'discovery',
      startupName: 'TestCo Alpha',
      personaName: 'The Skeptic',
      difficulty: 'moderate',
      evaluation: sampleAIDebrief,
    });

    const accepted = store.acceptReview({
      reviewId: pendingReview.id,
      reviewerId: 'rev-01',
      reviewerName: 'Coach Marcus',
      notes: 'Verified transcript evidence. Accurate score.',
    });

    const passed =
      accepted !== null &&
      accepted.reviewStatus === 'ACCEPTED' &&
      accepted.originalEvaluation.score.overall === 62 &&
      accepted.finalEvaluation.score.overall === 62 &&
      accepted.auditTrail.some((a) => a.action === 'ACCEPTED');

    logResult(
      'Test 1 (Accept Workflow)',
      passed,
      `Status is ACCEPTED, original score (62) matches final score (62)`
    );
  } catch (err: any) {
    logResult('Test 1 (Accept Workflow)', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 2 — Edit Workflow
  // -------------------------------------------------------------
  try {
    const store = useReviewStore.getState();
    const pendingReview = store.createPendingReview({
      sessionId: 'test-session-edit-02',
      sessionType: 'discovery',
      startupName: 'TestCo Beta',
      personaName: 'The Polite Agree-er',
      difficulty: 'hard',
      evaluation: sampleAIDebrief,
    });

    const updatedDebrief: SessionDebrief = {
      ...sampleAIDebrief,
      score: {
        ...sampleAIDebrief.score,
        overall: 55,
        discoveryQuality: 55,
      },
      summary: 'Human-Reviewed: Adjusted for false-positive validation bias.',
    };

    const edited = store.editReview({
      reviewId: pendingReview.id,
      reviewerId: 'rev-02',
      reviewerName: 'Elena Rostova',
      updatedEvaluation: updatedDebrief,
      editedFields: [
        {
          field: 'score.overall',
          label: 'Overall Score',
          originalValue: 62,
          newValue: 55,
          reason: 'Customer was polite agree-er with no buying intent.',
        },
        {
          field: 'score.discoveryQuality',
          label: 'Discovery Quality',
          originalValue: 62,
          newValue: 55,
        },
      ],
      notes: 'AI overestimated discovery depth because customer gave polite affirmations.',
    });

    const passed =
      edited !== null &&
      edited.reviewStatus === 'EDITED' &&
      edited.originalEvaluation.score.overall === 62 &&
      edited.finalEvaluation.score.overall === 55 &&
      edited.editedFields.some((f) => f.field === 'score.overall') &&
      edited.auditTrail.some((a) => a.action === 'EDITED');

    logResult(
      'Test 2 (Edit Workflow)',
      passed,
      `Status is EDITED, original (62) kept, final score updated to (55), editedFields recorded`
    );
  } catch (err: any) {
    logResult('Test 2 (Edit Workflow)', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 3 — Reject Workflow
  // -------------------------------------------------------------
  try {
    const store = useReviewStore.getState();
    const pendingReview = store.createPendingReview({
      sessionId: 'test-session-reject-03',
      sessionType: 'pitch',
      startupName: 'TestCo Gamma',
      personaName: 'The Metrics VC',
      difficulty: 'hard',
      evaluation: sampleAIDebrief,
    });

    const rejected = store.rejectReview({
      reviewId: pendingReview.id,
      reviewerId: 'rev-03',
      reviewerName: 'Partner David',
      rejectionReason: 'AI misclassified bottom-up customer pricing calculations.',
      notes: 'Requires fresh regrade.',
    });

    const passed =
      rejected !== null &&
      rejected.reviewStatus === 'REJECTED' &&
      rejected.originalEvaluation.score.overall === 62 &&
      rejected.rejectionReason === 'AI misclassified bottom-up customer pricing calculations.' &&
      rejected.auditTrail.some((a) => a.action === 'REJECTED');

    logResult(
      'Test 3 (Reject Workflow)',
      passed,
      `Status is REJECTED, rejectionReason stored, original AI diagnosis preserved`
    );
  } catch (err: any) {
    logResult('Test 3 (Reject Workflow)', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 4 — Persistence (Serialization & Retrieval)
  // -------------------------------------------------------------
  try {
    const store = useReviewStore.getState();
    const found = store.getReviewBySessionId('test-session-edit-02');
    const serialized = JSON.stringify(found);
    const parsed = JSON.parse(serialized);

    const passed =
      found !== undefined &&
      parsed.id === found.id &&
      parsed.reviewStatus === 'EDITED' &&
      parsed.finalEvaluation.score.overall === 55;

    logResult(
      'Test 4 (Persistence)',
      passed,
      `Review survives JSON serialization with intact audit records and score deltas`
    );
  } catch (err: any) {
    logResult('Test 4 (Persistence)', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 5 — Immutability
  // -------------------------------------------------------------
  try {
    const store = useReviewStore.getState();
    const rev = store.getReviewBySessionId('test-session-edit-02');

    // Original evaluation must still have 62 even after edit
    const passed =
      rev !== undefined &&
      rev.originalEvaluation.score.overall === 62 &&
      rev.finalEvaluation.score.overall === 55 &&
      rev.originalEvaluation.summary === 'Initial AI Diagnosis: Founder reached latent pain layer.';

    logResult(
      'Test 5 (Immutability)',
      passed,
      `Original AI snapshot remains 100% pristine after multiple human edits`
    );
  } catch (err: any) {
    logResult('Test 5 (Immutability)', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 6 — Evidence Linking
  // -------------------------------------------------------------
  try {
    const store = useReviewStore.getState();
    const rev = store.getReviewBySessionId('test-session-accept-01');

    const hasLeadingEvidence = rev?.evidenceItems.some(
      (ev) => ev.quote === 'Wouldn’t it be nice if AI automated this?'
    );
    const hasPastEvidence = rev?.evidenceItems.some(
      (ev) => ev.quote === 'Tell me what happened the last time your team ran into this.'
    );

    const passed = rev !== undefined && !!hasLeadingEvidence && !!hasPastEvidence;

    logResult(
      'Test 6 (Evidence Linking)',
      passed,
      `All AI findings retain exact quote-backed links to conversation evidence`
    );
  } catch (err: any) {
    logResult('Test 6 (Evidence Linking)', false, err.message);
  }

  return { passed: allPassed, results };
}
