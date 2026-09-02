/**
 * VentureCue — Founder Progress & Performance Analytics Test Suite
 * Validates the 14 core analytics requirements:
 * 1. Empty history handling
 * 2. Single session preliminary state
 * 3. Multiple sessions trend calculation
 * 4. Recurring weakness classification threshold (3+ sessions)
 * 5. Improving weakness trajectory (7 -> 5 -> 3 -> 1)
 * 6. Declining skill detection (82 -> 75 -> 66)
 * 7. Human-edited evaluation precedence (final: 55, original: 62)
 * 8. Rejected evaluation exclusion
 * 9. Pending evaluation provisional marking
 * 10. Session deletion recalculation
 * 11. Module filtering (Discovery vs Pitch)
 * 12. Persona aggregation and sample size
 * 13. Insufficient data classification (1 occurrence = ISOLATED)
 * 14. Malformed/incomplete session resilience
 */

import { ProgressAnalyticsService } from '../services/analytics/ProgressAnalyticsService';
import type { Session, SessionDebrief } from '../types/session';
import type { HumanReview } from '../types/review';

export function runProgressAnalyticsTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  const logResult = (testName: string, passed: boolean, detail: string) => {
    if (!passed) allPassed = false;
    results.push(`[${passed ? 'PASS' : 'FAIL'}] ${testName}: ${detail}`);
  };

  const createMockDebrief = (score: number, leadingQuestions = 0, questionQuality = 70): SessionDebrief => ({
    score: {
      overall: score,
      discoveryQuality: score,
      questionQuality,
      listeningQuality: 70,
      evidenceGathering: 65,
      goalCoverage: 60,
      leadingQuestions,
    },
    strongMoments: [{ id: 'sm-1', type: 'strong', label: 'Probed past behavior', description: 'Good probe' }],
    weakMoments: leadingQuestions > 0 ? [{ id: 'wm-1', type: 'weak', label: 'Leading question', description: 'Nudged user' }] : [],
    leadingQuestionFlags: leadingQuestions > 0 ? Array(leadingQuestions).fill({ id: 'lf', founderQuote: 'Lead?', issue: 'Lead', betterAlternative: 'Alt' }) : [],
    improvements: ['Ask past behavior questions'],
    summary: `Mock debrief with score ${score}`,
  });

  const createMockSession = (p: {
    id: string;
    type?: 'discovery' | 'pitch';
    personaId?: string;
    personaName?: string;
    difficulty?: any;
    startedAt?: number;
    score: number;
    leadingQuestions?: number;
    questionQuality?: number;
  }): Session => ({
    id: p.id,
    type: p.type || 'discovery',
    personaId: p.personaId || 'skeptic',
    personaName: p.personaName || 'The Skeptic',
    difficulty: p.difficulty || 'moderate',
    startedAt: p.startedAt || 1000,
    transcript: [],
    debrief: createMockDebrief(p.score, p.leadingQuestions || 0, p.questionQuality || 70),
  });

  // -------------------------------------------------------------
  // TEST 1 — Empty history
  // -------------------------------------------------------------
  try {
    const report = ProgressAnalyticsService.generateReport({ sessions: [], reviews: [] });
    const passed =
      report.totalSessions === 0 &&
      report.dataSufficiency === 'ZERO_SESSIONS' &&
      report.overallAverageScore === 0 &&
      report.nextPracticeRecommendation !== undefined;

    logResult(
      'TEST 1 (Empty History)',
      passed,
      'Empty state handled gracefully with initial drill recommendation'
    );
  } catch (err: any) {
    logResult('TEST 1 (Empty History)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 2 — Single session
  // -------------------------------------------------------------
  try {
    const mockSession = createMockSession({ id: 'sess-1', score: 72 });

    const report = ProgressAnalyticsService.generateReport({
      sessions: [mockSession],
      reviews: [],
    });

    const passed =
      report.totalSessions === 1 &&
      report.dataSufficiency === 'SINGLE_SESSION' &&
      report.overallAverageScore === 72 &&
      report.overallScoreTrend === 'INSUFFICIENT_DATA';

    logResult(
      'TEST 2 (Single Session)',
      passed,
      'Single session recorded with preliminary sufficiency notice'
    );
  } catch (err: any) {
    logResult('TEST 2 (Single Session)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 3 — Multiple sessions trend calculation
  // -------------------------------------------------------------
  try {
    const sessions: Session[] = [
      createMockSession({ id: 's1', startedAt: 1000, score: 60 }),
      createMockSession({ id: 's2', startedAt: 2000, score: 68 }),
      createMockSession({ id: 's3', startedAt: 3000, score: 76 }),
    ];

    const report = ProgressAnalyticsService.generateReport({ sessions, reviews: [] });
    const passed =
      report.totalSessions === 3 &&
      report.dataSufficiency === 'ROBUST' &&
      report.overallAverageScore === 68 &&
      report.overallScoreTrend === 'IMPROVING' &&
      report.overallScoreChange === 16;

    logResult(
      'TEST 3 (Multiple Sessions)',
      passed,
      'Multi-session score trajectory calculated as IMPROVING (+16 pts)'
    );
  } catch (err: any) {
    logResult('TEST 3 (Multiple Sessions)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 4 — Recurring weakness (3+ sessions threshold)
  // -------------------------------------------------------------
  try {
    const sessions: Session[] = [
      createMockSession({ id: 's1', startedAt: 1000, score: 60, leadingQuestions: 4 }),
      createMockSession({ id: 's2', startedAt: 2000, score: 65, leadingQuestions: 3 }),
      createMockSession({ id: 's3', startedAt: 3000, score: 70, leadingQuestions: 2 }),
    ];

    const report = ProgressAnalyticsService.generateReport({ sessions, reviews: [] });
    const leadingWk = report.recurringWeaknesses.find((w) => w.id === 'wk-leading-questions');
    const passed =
      leadingWk !== undefined &&
      leadingWk.status === 'RECURRING' &&
      leadingWk.frequency === 3;

    logResult(
      'TEST 4 (Recurring Weakness Threshold)',
      passed,
      'Leading questions correctly classified as RECURRING after 3 sessions'
    );
  } catch (err: any) {
    logResult('TEST 4 (Recurring Weakness Threshold)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 5 — Improving weakness trajectory (7 -> 5 -> 3 -> 1)
  // -------------------------------------------------------------
  try {
    const sessions: Session[] = [
      createMockSession({ id: 's1', startedAt: 1000, score: 50, leadingQuestions: 7 }),
      createMockSession({ id: 's2', startedAt: 2000, score: 60, leadingQuestions: 5 }),
      createMockSession({ id: 's3', startedAt: 3000, score: 70, leadingQuestions: 3 }),
      createMockSession({ id: 's4', startedAt: 4000, score: 80, leadingQuestions: 1 }),
    ];

    const report = ProgressAnalyticsService.generateReport({ sessions, reviews: [] });
    const leadingWk = report.recurringWeaknesses.find((w) => w.id === 'wk-leading-questions');
    const passed =
      leadingWk !== undefined &&
      leadingWk.trendDirection === 'IMPROVING' &&
      JSON.stringify(leadingWk.occurrences) === JSON.stringify([7, 5, 3, 1]);

    logResult(
      'TEST 5 (Improving Weakness Trajectory)',
      passed,
      'Leading question drop (7 -> 5 -> 3 -> 1) detected with trend IMPROVING'
    );
  } catch (err: any) {
    logResult('TEST 5 (Improving Weakness Trajectory)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 6 — Declining skill detection (82 -> 75 -> 66)
  // -------------------------------------------------------------
  try {
    const sessions: Session[] = [
      createMockSession({ id: 's1', startedAt: 1000, score: 82, questionQuality: 82 }),
      createMockSession({ id: 's2', startedAt: 2000, score: 75, questionQuality: 75 }),
      createMockSession({ id: 's3', startedAt: 3000, score: 66, questionQuality: 66 }),
    ];

    const report = ProgressAnalyticsService.generateReport({ sessions, reviews: [] });
    const qqSkill = report.discoverySkills.find((s) => s.skillKey === 'questionQuality');
    const passed =
      qqSkill !== undefined &&
      qqSkill.trend === 'DECLINING' &&
      qqSkill.change === -16;

    logResult(
      'TEST 6 (Declining Skill Detection)',
      passed,
      'Question quality drop (82 -> 75 -> 66) identified as DECLINING (-16 pts)'
    );
  } catch (err: any) {
    logResult('TEST 6 (Declining Skill Detection)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 7 — Human-edited evaluation precedence
  // -------------------------------------------------------------
  try {
    const session = createMockSession({ id: 'sess-edited-01', startedAt: 1000, score: 62 });

    const review: HumanReview = {
      id: 'rev-01',
      sessionId: 'sess-edited-01',
      sessionType: 'discovery',
      startupName: 'TestCo',
      personaName: 'The Skeptic',
      difficulty: 'moderate',
      reviewStatus: 'EDITED',
      reviewerId: 'coach-1',
      reviewerName: 'Coach Marcus',
      createdAt: 1100,
      originalEvaluation: createMockDebrief(62),
      finalEvaluation: createMockDebrief(55),
      editedFields: [{ field: 'score.overall', label: 'Overall', originalValue: 62, newValue: 55 }],
      evidenceItems: [],
      auditTrail: [],
      aiVersion: '1.0',
      reviewVersion: 2,
    };

    const report = ProgressAnalyticsService.generateReport({
      sessions: [session],
      reviews: [review],
    });

    const passed =
      report.overallAverageScore === 55 &&
      report.humanReviewedCount === 1;

    logResult(
      'TEST 7 (Human-Edited Precedence)',
      passed,
      'Human-edited score (55) takes precedence over original AI score (62)'
    );
  } catch (err: any) {
    logResult('TEST 7 (Human-Edited Precedence)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 8 — Rejected evaluation exclusion
  // -------------------------------------------------------------
  try {
    const session1 = createMockSession({ id: 'sess-valid', startedAt: 1000, score: 80 });
    const session2 = createMockSession({ id: 'sess-rejected', startedAt: 2000, score: 20 });

    const reviewRejected: HumanReview = {
      id: 'rev-rej',
      sessionId: 'sess-rejected',
      sessionType: 'discovery',
      startupName: 'TestCo',
      personaName: 'The Skeptic',
      difficulty: 'moderate',
      reviewStatus: 'REJECTED',
      reviewerId: 'coach-1',
      reviewerName: 'Coach Marcus',
      rejectionReason: 'Invalid AI diagnosis',
      createdAt: 2100,
      originalEvaluation: createMockDebrief(20),
      finalEvaluation: createMockDebrief(20),
      editedFields: [],
      evidenceItems: [],
      auditTrail: [],
      aiVersion: '1.0',
      reviewVersion: 2,
    };

    const report = ProgressAnalyticsService.generateReport({
      sessions: [session1, session2],
      reviews: [reviewRejected],
    });

    // Valid average should be 80, NOT (80+20)/2 = 50
    const passed =
      report.overallAverageScore === 80 &&
      report.rejectedCount === 1;

    logResult(
      'TEST 8 (Rejected Evaluation Exclusion)',
      passed,
      'Rejected diagnosis (20) excluded from performance average, maintaining true score (80)'
    );
  } catch (err: any) {
    logResult('TEST 8 (Rejected Evaluation Exclusion)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 9 — Pending evaluation provisional marking
  // -------------------------------------------------------------
  try {
    const session = createMockSession({ id: 'sess-pending', startedAt: 1000, score: 75 });

    const reviewPending: HumanReview = {
      id: 'rev-pnd',
      sessionId: 'sess-pending',
      sessionType: 'discovery',
      startupName: 'TestCo',
      personaName: 'The Skeptic',
      difficulty: 'moderate',
      reviewStatus: 'PENDING',
      reviewerId: '',
      reviewerName: '',
      createdAt: 1100,
      originalEvaluation: createMockDebrief(75),
      finalEvaluation: createMockDebrief(75),
      editedFields: [],
      evidenceItems: [],
      auditTrail: [],
      aiVersion: '1.0',
      reviewVersion: 1,
    };

    const report = ProgressAnalyticsService.generateReport({
      sessions: [session],
      reviews: [reviewPending],
    });

    const passed =
      report.aiOnlyCount === 1 &&
      report.humanReviewedCount === 0 &&
      report.overallAverageScore === 75;

    logResult(
      'TEST 9 (Pending Evaluation Provisional Marking)',
      passed,
      'Pending review counted as AI provisional without false human validation claims'
    );
  } catch (err: any) {
    logResult('TEST 9 (Pending Evaluation Provisional Marking)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 10 — Session deletion recalculation
  // -------------------------------------------------------------
  try {
    const session1 = createMockSession({ id: 's1', startedAt: 1000, score: 60 });
    const session2 = createMockSession({ id: 's2', startedAt: 2000, score: 80 });

    const reportBefore = ProgressAnalyticsService.generateReport({ sessions: [session1, session2], reviews: [] });
    // Simulate deleting session 1
    const reportAfter = ProgressAnalyticsService.generateReport({ sessions: [session2], reviews: [] });

    const passed =
      reportBefore.totalSessions === 2 &&
      reportBefore.overallAverageScore === 70 &&
      reportAfter.totalSessions === 1 &&
      reportAfter.overallAverageScore === 80;

    logResult(
      'TEST 10 (Session Deletion Recalculation)',
      passed,
      'Session deletion immediately recalculates performance metrics and totals'
    );
  } catch (err: any) {
    logResult('TEST 10 (Session Deletion Recalculation)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 11 — Module filtering
  // -------------------------------------------------------------
  try {
    const sessions: Session[] = [
      createMockSession({ id: 'd1', type: 'discovery', personaId: 'skeptic', startedAt: 1000, score: 65 }),
      createMockSession({ id: 'p1', type: 'pitch', personaId: 'numbers-focused', startedAt: 2000, score: 85 }),
    ];

    const discoveryOnly = ProgressAnalyticsService.generateReport({
      sessions,
      reviews: [],
      filters: { module: 'discovery' },
    });

    const pitchOnly = ProgressAnalyticsService.generateReport({
      sessions,
      reviews: [],
      filters: { module: 'pitch' },
    });

    const passed =
      discoveryOnly.totalSessions === 1 &&
      discoveryOnly.overallAverageScore === 65 &&
      pitchOnly.totalSessions === 1 &&
      pitchOnly.overallAverageScore === 85;

    logResult(
      'TEST 11 (Module Filtering)',
      passed,
      'Discovery and Pitch module filters isolate domain-specific performance'
    );
  } catch (err: any) {
    logResult('TEST 11 (Module Filtering)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 12 — Persona analysis
  // -------------------------------------------------------------
  try {
    const sessions: Session[] = [
      createMockSession({ id: 's1', personaId: 'skeptic', personaName: 'The Skeptic', startedAt: 1000, score: 60 }),
      createMockSession({ id: 's2', personaId: 'skeptic', personaName: 'The Skeptic', startedAt: 2000, score: 70 }),
      createMockSession({ id: 's3', personaId: 'busy-exec', personaName: 'The Busy Exec', startedAt: 3000, score: 80 }),
    ];

    const report = ProgressAnalyticsService.generateReport({ sessions, reviews: [] });
    const skepticPerf = report.personaBreakdowns.find((p) => p.personaId === 'skeptic');
    const busyPerf = report.personaBreakdowns.find((p) => p.personaId === 'busy-exec');

    const passed =
      skepticPerf !== undefined &&
      skepticPerf.sessionsCount === 2 &&
      skepticPerf.averageScore === 65 &&
      busyPerf !== undefined &&
      busyPerf.sessionsCount === 1 &&
      busyPerf.averageScore === 80;

    logResult(
      'TEST 12 (Persona Analysis)',
      passed,
      'Persona matrix accurately groups sessions and averages per archetype'
    );
  } catch (err: any) {
    logResult('TEST 12 (Persona Analysis)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 13 — Insufficient data for single occurrence
  // -------------------------------------------------------------
  try {
    const sessions: Session[] = [
      createMockSession({ id: 's1', startedAt: 1000, score: 70, leadingQuestions: 2 }),
    ];

    const report = ProgressAnalyticsService.generateReport({ sessions, reviews: [] });
    const leadingWk = report.recurringWeaknesses.find((w) => w.id === 'wk-leading-questions');
    const passed =
      leadingWk !== undefined &&
      leadingWk.status === 'ISOLATED';

    logResult(
      'TEST 13 (Insufficient Data for Weakness)',
      passed,
      'Single occurrence of a weakness correctly classified as ISOLATED, not RECURRING'
    );
  } catch (err: any) {
    logResult('TEST 13 (Insufficient Data for Weakness)', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 14 — Malformed/incomplete session resilience
  // -------------------------------------------------------------
  try {
    const validSession = createMockSession({ id: 's1', startedAt: 1000, score: 75 });
    const malformedSession: any = { id: 's-bad', type: 'discovery', startedAt: null }; // missing debrief and date

    const report = ProgressAnalyticsService.generateReport({
      sessions: [validSession, malformedSession],
      reviews: [],
    });

    const passed =
      report.totalSessions === 1 &&
      report.overallAverageScore === 75;

    logResult(
      'TEST 14 (Malformed Session Resilience)',
      passed,
      'Malformed or corrupted session skipped safely without crashing analytics engine'
    );
  } catch (err: any) {
    logResult('TEST 14 (Malformed Session Resilience)', false, err.message);
  }

  return { passed: allPassed, results };
}
