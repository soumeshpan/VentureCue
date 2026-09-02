/**
 * VentureCue — Progress & Performance Analytics Calculation Service
 * Dynamically derives skill trajectories, recurring weaknesses, and personalized practice drills
 * from historical practice sessions and human review records.
 */

import type { Session, SessionDebrief, Difficulty } from '../../types/session';
import type { HumanReview } from '../../types/review';
import type {
  FounderProgressReport,
  SkillTrend,
  SkillProgressPoint,
  RecurringWeakness,
  StrengthHighlight,
  PersonaPerformance,
  NextPracticeRecommendation,
  ProgressMilestone,
  TrendDirection,
} from '../../types/progress';

export interface ProgressFilterOptions {
  module?: 'all' | 'discovery' | 'pitch';
  timeframe?: 'all' | '30d' | '90d';
}

interface ResolvedSessionEval {
  session: Session;
  evaluation: SessionDebrief;
  originalAIEvaluation: SessionDebrief;
  provenance: 'HUMAN_REVIEWED' | 'HUMAN_EDITED' | 'AI_PROVISIONAL' | 'AI_REJECTED';
  isRejected: boolean;
  score: number;
}

export class ProgressAnalyticsService {
  /**
   * Generates the comprehensive founder progress report from persisted data.
   */
  public static generateReport(params: {
    sessions: Session[];
    reviews: HumanReview[];
    filters?: ProgressFilterOptions;
  }): FounderProgressReport {
    const { sessions, reviews, filters } = params;
    const moduleFilter = filters?.module || 'all';
    const timeframeFilter = filters?.timeframe || 'all';

    // 1. Filter sessions by date window
    const now = Date.now();
    const timeframeCutoff =
      timeframeFilter === '30d'
        ? now - 30 * 24 * 60 * 60 * 1000
        : timeframeFilter === '90d'
        ? now - 90 * 24 * 60 * 60 * 1000
        : 0;

    const filteredSessions = sessions.filter((s) => {
      if (!s || !s.startedAt) return false;
      if (s.startedAt < timeframeCutoff) return false;
      if (moduleFilter === 'discovery' && s.type !== 'discovery') return false;
      if (moduleFilter === 'pitch' && s.type !== 'pitch') return false;
      return true;
    });

    // 2. Resolve Provenance & Evaluations (Human Review takes precedence over AI-only)
    const reviewMap = new Map<string, HumanReview>();
    reviews.forEach((r) => {
      if (r && r.sessionId) reviewMap.set(r.sessionId, r);
    });

    const resolvedRecords: ResolvedSessionEval[] = [];
    let humanReviewedCount = 0;
    let aiOnlyCount = 0;
    let rejectedCount = 0;

    // Sort chronologically ascending
    const sortedSessions = [...filteredSessions].sort((a, b) => a.startedAt - b.startedAt);

    for (const session of sortedSessions) {
      if (!session.debrief || !session.debrief.score) continue; // skip malformed/incomplete

      const review = reviewMap.get(session.id);
      let provenance: ResolvedSessionEval['provenance'] = 'AI_PROVISIONAL';
      let evaluation = session.debrief;
      let originalAIEvaluation = session.debrief;
      let isRejected = false;

      if (review) {
        if (review.reviewStatus === 'REJECTED') {
          provenance = 'AI_REJECTED';
          isRejected = true;
          rejectedCount++;
        } else if (review.reviewStatus === 'EDITED') {
          provenance = 'HUMAN_EDITED';
          evaluation = review.finalEvaluation || session.debrief;
          originalAIEvaluation = review.originalEvaluation || session.debrief;
          humanReviewedCount++;
        } else if (review.reviewStatus === 'ACCEPTED') {
          provenance = 'HUMAN_REVIEWED';
          evaluation = review.finalEvaluation || session.debrief;
          originalAIEvaluation = review.originalEvaluation || session.debrief;
          humanReviewedCount++;
        } else {
          provenance = 'AI_PROVISIONAL';
          aiOnlyCount++;
        }
      } else {
        provenance = 'AI_PROVISIONAL';
        aiOnlyCount++;
      }

      const score = evaluation.score?.overall ?? 0;

      resolvedRecords.push({
        session,
        evaluation,
        originalAIEvaluation,
        provenance,
        isRejected,
        score,
      });
    }

    // Filter valid evaluations for performance analytics (exclude rejected diagnoses)
    const validRecords = resolvedRecords.filter((r) => !r.isRejected);
    const totalSessions = resolvedRecords.length;
    const discoveryRecords = validRecords.filter((r) => r.session.type === 'discovery');
    const pitchRecords = validRecords.filter((r) => r.session.type === 'pitch');

    // 3. Determine Data Sufficiency
    let dataSufficiency: FounderProgressReport['dataSufficiency'] = 'ZERO_SESSIONS';
    let dataSufficiencyNote = 'No practice history yet. Start your first session to begin tracking progress.';

    if (validRecords.length === 1) {
      dataSufficiency = 'SINGLE_SESSION';
      dataSufficiencyNote = '1 session completed. Complete 2 or more sessions to enable trend calculations.';
    } else if (validRecords.length === 2) {
      dataSufficiency = 'PRELIMINARY';
      dataSufficiencyNote = '2 sessions recorded. Trends are preliminary and will sharpen with continued practice.';
    } else if (validRecords.length >= 3) {
      dataSufficiency = 'ROBUST';
      dataSufficiencyNote = `Robust performance trend based on ${validRecords.length} completed sessions.`;
    }

    // 4. Overall Score Analytics
    const scores = validRecords.map((r) => r.score);
    const overallAverageScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const latestOverallScore = scores.length > 0 ? scores[scores.length - 1] : undefined;

    let overallScoreTrend: TrendDirection = 'INSUFFICIENT_DATA';
    let overallScoreChange = 0;

    if (scores.length >= 2) {
      const first = scores[0];
      const last = scores[scores.length - 1];
      overallScoreChange = last - first;

      if (scores.length >= 3) {
        if (overallScoreChange >= 3) overallScoreTrend = 'IMPROVING';
        else if (overallScoreChange <= -3) overallScoreTrend = 'DECLINING';
        else overallScoreTrend = 'STABLE';
      } else {
        overallScoreTrend = 'INSUFFICIENT_DATA';
      }
    }

    // 5. Skill Trend Tracking for Customer Discovery
    const discoverySkills: SkillTrend[] = this.calculateDiscoverySkillTrends(discoveryRecords);

    // 6. Skill Trend Tracking for Investor Pitch
    const pitchSkills: SkillTrend[] = this.calculatePitchSkillTrends(pitchRecords);

    // Identify overall strongest & weakest skill
    const allSkills = [...discoverySkills, ...pitchSkills];
    const sortedSkills = [...allSkills].sort((a, b) => b.currentScore - a.currentScore);
    const strongestSkill =
      sortedSkills.length > 0
        ? { label: sortedSkills[0].label, score: sortedSkills[0].currentScore }
        : undefined;
    const weakestSkill =
      sortedSkills.length > 0
        ? {
            label: sortedSkills[sortedSkills.length - 1].label,
            score: sortedSkills[sortedSkills.length - 1].currentScore,
          }
        : undefined;

    // 7. Recurring Weakness Detection
    const recurringWeaknesses = this.detectRecurringWeaknesses(validRecords);

    // 8. Consistently Strong Areas
    const topStrengths = this.extractTopStrengths(validRecords, allSkills);

    // 9. Persona Performance Analysis
    const personaBreakdowns = this.calculatePersonaBreakdown(validRecords);

    // 10. Milestones
    const milestones = this.detectMilestones(validRecords, discoveryRecords, pitchRecords);

    // 11. Personalized Next Practice Recommendation
    const nextPracticeRecommendation = this.generateNextPracticeRecommendation({
      validRecords,
      recurringWeaknesses,
      weakestSkill,
      discoveryRecords,
      pitchRecords,
    });

    // 12. Personalized Coaching Summary
    const personalizedCoachingSummary = this.generateCoachingSummary({
      dataSufficiency,
      overallScoreTrend,
      overallScoreChange,
      strongestSkill,
      weakestSkill,
      recurringWeaknesses,
      discoveryCount: discoveryRecords.length,
      pitchCount: pitchRecords.length,
    });

    return {
      totalSessions,
      discoverySessionsCount: resolvedRecords.filter((r) => r.session.type === 'discovery').length,
      pitchSessionsCount: resolvedRecords.filter((r) => r.session.type === 'pitch').length,
      humanReviewedCount,
      aiOnlyCount,
      rejectedCount,

      overallAverageScore,
      latestOverallScore,
      overallScoreTrend,
      overallScoreChange,

      strongestSkill,
      weakestSkill,

      discoverySkills,
      pitchSkills,

      recurringWeaknesses,
      topStrengths,
      personaBreakdowns,
      milestones,

      personalizedCoachingSummary,
      nextPracticeRecommendation,

      dataSufficiency,
      dataSufficiencyNote,
    };
  }

  // --- Skill Trend Calculations ---

  private static calculateDiscoverySkillTrends(records: ResolvedSessionEval[]): SkillTrend[] {
    const definitions = [
      { key: 'discoveryQuality', label: 'Discovery Quality' },
      { key: 'questionQuality', label: 'Question Quality' },
      { key: 'listeningQuality', label: 'Listening & Empathy' },
      { key: 'evidenceGathering', label: 'Evidence Gathering' },
      { key: 'goalCoverage', label: 'Goal Coverage' },
    ];

    return definitions.map((def) => {
      const history: SkillProgressPoint[] = [];

      records.forEach((r) => {
        const rawScore = (r.evaluation.score as any)?.[def.key];
        if (typeof rawScore === 'number') {
          history.push({
            sessionId: r.session.id,
            sessionDate: r.session.startedAt,
            score: rawScore,
            provenance: r.provenance,
          });
        }
      });

      return this.buildSkillTrendObject('discovery', def.key, def.label, history);
    });
  }

  private static calculatePitchSkillTrends(records: ResolvedSessionEval[]): SkillTrend[] {
    const definitions = [
      { key: 'pitchClarity', label: 'Pitch Clarity' },
      { key: 'answerQuality', label: 'Answer Quality' },
      { key: 'businessUnderstanding', label: 'Business Understanding' },
      { key: 'marketUnderstanding', label: 'Market Understanding' },
      { key: 'tractionUnderstanding', label: 'Traction' },
      { key: 'objectionHandling', label: 'Objection Handling' },
      { key: 'conciseness', label: 'Conciseness' },
    ];

    return definitions.map((def) => {
      const history: SkillProgressPoint[] = [];

      records.forEach((r) => {
        const rawScore = (r.evaluation.score as any)?.[def.key];
        if (typeof rawScore === 'number') {
          history.push({
            sessionId: r.session.id,
            sessionDate: r.session.startedAt,
            score: rawScore,
            provenance: r.provenance,
          });
        }
      });

      return this.buildSkillTrendObject('pitch', def.key, def.label, history);
    });
  }

  private static buildSkillTrendObject(
    module: 'discovery' | 'pitch',
    key: string,
    label: string,
    history: SkillProgressPoint[]
  ): SkillTrend {
    if (history.length === 0) {
      return {
        skillKey: key,
        label,
        module,
        currentScore: 0,
        change: 0,
        averageScore: 0,
        trend: 'INSUFFICIENT_DATA',
        dataPointsCount: 0,
        history: [],
      };
    }

    const currentScore = history[history.length - 1].score;
    const previousScore = history.length > 1 ? history[history.length - 2].score : undefined;
    const firstScore = history[0].score;
    const change = currentScore - firstScore;
    const averageScore = Math.round(history.reduce((sum, p) => sum + p.score, 0) / history.length);

    let trend: TrendDirection = 'INSUFFICIENT_DATA';
    if (history.length >= 3) {
      if (change >= 4) trend = 'IMPROVING';
      else if (change <= -4) trend = 'DECLINING';
      else trend = 'STABLE';
    }

    return {
      skillKey: key,
      label,
      module,
      currentScore,
      previousScore,
      change,
      averageScore,
      trend,
      dataPointsCount: history.length,
      history,
    };
  }

  // --- Recurring Weakness Detection ---

  private static detectRecurringWeaknesses(records: ResolvedSessionEval[]): RecurringWeakness[] {
    if (records.length === 0) return [];

    const totalSessions = records.length;
    const weaknesses: RecurringWeakness[] = [];

    // 1. Leading Questions in Customer Discovery
    const discoveryRecords = records.filter((r) => r.session.type === 'discovery');
    if (discoveryRecords.length > 0) {
      const leadingCounts = discoveryRecords.map(
        (r) => r.evaluation.leadingQuestionFlags?.length || r.evaluation.score?.leadingQuestions || 0
      );
      const sessionsWithLeading = leadingCounts.filter((c) => c > 0).length;

      if (sessionsWithLeading >= 1) {
        const isRecurring = sessionsWithLeading >= 3;
        const isEmerging = sessionsWithLeading === 2;

        let trendDirection: RecurringWeakness['trendDirection'] = 'STABLE';
        if (leadingCounts.length >= 2) {
          const first = leadingCounts[0];
          const latest = leadingCounts[leadingCounts.length - 1];
          if (latest < first) trendDirection = 'IMPROVING';
          else if (latest > first) trendDirection = 'WORSENING';
        }

        weaknesses.push({
          id: 'wk-leading-questions',
          category: 'discovery',
          title: 'Leading Questions',
          description: 'Nudging the customer toward positive answers rather than probing objective past behavior.',
          frequency: sessionsWithLeading,
          totalSessionsEvaluated: discoveryRecords.length,
          occurrences: leadingCounts,
          status: isRecurring ? 'RECURRING' : isEmerging ? 'EMERGING' : 'ISOLATED',
          trendDirection,
          recommendedPractice: 'Ask neutral past-behavior questions (e.g. "What happened the last time you ran into this?") without suggesting a software solution.',
          recommendedPersonaId: 'skeptic',
          recommendedDifficulty: 'moderate',
        });
      }

      // 2. Premature Pitching
      const prematureCounts = discoveryRecords.map(
        (r) => r.evaluation.prematurePitchFlags?.length || r.evaluation.score?.prematurePitching || 0
      );
      const sessionsWithPremature = prematureCounts.filter((c) => c > 0).length;

      if (sessionsWithPremature >= 1) {
        weaknesses.push({
          id: 'wk-premature-pitching',
          category: 'discovery',
          title: 'Premature Solution Pitching',
          description: 'Introducing product features before fully diagnosing customer workflow consequences and workarounds.',
          frequency: sessionsWithPremature,
          totalSessionsEvaluated: discoveryRecords.length,
          occurrences: prematureCounts,
          status: sessionsWithPremature >= 3 ? 'RECURRING' : sessionsWithPremature === 2 ? 'EMERGING' : 'ISOLATED',
          trendDirection: 'STABLE',
          recommendedPractice: 'Hold off on describing your product until the customer has explicitly quantified their current operational loss.',
          recommendedPersonaId: 'polite-agree',
          recommendedDifficulty: 'hard',
        });
      }
    }

    // 3. Quantitative Unit Economics in Investor Pitch
    const pitchRecords = records.filter((r) => r.session.type === 'pitch');
    if (pitchRecords.length > 0) {
      const weakAnswerCounts = pitchRecords.map(
        (r) => r.evaluation.weakAnswers?.length || 0
      );
      const sessionsWithWeakAnswers = weakAnswerCounts.filter((c) => c > 0).length;

      if (sessionsWithWeakAnswers >= 1) {
        weaknesses.push({
          id: 'wk-quantitative-answers',
          category: 'pitch',
          title: 'Vague or Unsubstantiated Unit Economics',
          description: 'Describing market vision without backing CAC payback periods, gross margins, and retention numbers.',
          frequency: sessionsWithWeakAnswers,
          totalSessionsEvaluated: pitchRecords.length,
          occurrences: weakAnswerCounts,
          status: sessionsWithWeakAnswers >= 3 ? 'RECURRING' : sessionsWithWeakAnswers === 2 ? 'EMERGING' : 'ISOLATED',
          trendDirection: 'STABLE',
          recommendedPractice: 'Rehearse bottom-up revenue projections and defend CAC/LTV multiples with concrete historical data.',
          recommendedPersonaId: 'numbers-focused',
          recommendedDifficulty: 'hard',
        });
      }
    }

    return weaknesses;
  }

  // --- Strength Highlights ---

  private static extractTopStrengths(
    records: ResolvedSessionEval[],
    skills: SkillTrend[]
  ): StrengthHighlight[] {
    const highlights: StrengthHighlight[] = [];

    const strongSkills = skills.filter((s) => s.currentScore >= 70 && s.dataPointsCount >= 1);
    strongSkills.forEach((s) => {
      highlights.push({
        id: `str-${s.skillKey}`,
        title: `${s.label} — Consistently Strong`,
        description: `Maintained an average score of ${s.averageScore}/100 across ${s.dataPointsCount} sessions.`,
        averageScore: s.averageScore,
        growthDelta: s.change,
        consistencyScore: Math.min(95, s.currentScore + 5),
      });
    });

    if (highlights.length === 0 && records.length > 0) {
      highlights.push({
        id: 'str-active-practice',
        title: 'Active Practice Cadence',
        description: `Successfully completed ${records.length} rigorous simulation workouts.`,
        averageScore: 70,
        growthDelta: 0,
        consistencyScore: 80,
      });
    }

    return highlights;
  }

  // --- Persona Breakdown ---

  private static calculatePersonaBreakdown(records: ResolvedSessionEval[]): PersonaPerformance[] {
    const map = new Map<string, ResolvedSessionEval[]>();

    records.forEach((r) => {
      const pid = r.session.personaId || 'standard-persona';
      const list = map.get(pid) || [];
      list.push(r);
      map.set(pid, list);
    });

    const results: PersonaPerformance[] = [];
    map.forEach((list, personaId) => {
      const personaName = list[0].session.personaName || personaId;
      const module = list[0].session.type;
      const scores = list.map((l) => l.score);
      const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const latestScore = scores[scores.length - 1];
      const difficultyLevels = Array.from(new Set(list.map((l) => l.session.difficulty || 'moderate')));

      let keyObservation = `Completed ${list.length} practice run${list.length > 1 ? 's' : ''}.`;
      if (averageScore >= 75) {
        keyObservation = 'Strong confidence and minimal friction in managing this persona archetype.';
      } else if (averageScore <= 60) {
        keyObservation = 'Persistent challenge area. Recommend targeted question drills at current difficulty.';
      }

      results.push({
        personaId,
        personaName,
        module,
        sessionsCount: list.length,
        averageScore,
        latestScore,
        difficultyLevels,
        keyObservation,
      });
    });

    return results;
  }

  // --- Milestones ---

  private static detectMilestones(
    validRecords: ResolvedSessionEval[],
    discovery: ResolvedSessionEval[],
    pitch: ResolvedSessionEval[]
  ): ProgressMilestone[] {
    const milestones: ProgressMilestone[] = [];

    if (validRecords.length >= 1) {
      milestones.push({
        id: 'ms-first-session',
        title: 'First Practice Completed',
        description: 'Initiated founder conversation rehearsal on VentureCue.',
        achievedAt: validRecords[0].session.startedAt,
        category: 'milestone',
      });
    }

    if (validRecords.length >= 5) {
      milestones.push({
        id: 'ms-5-sessions',
        title: '5 Practice Workouts Logged',
        description: 'Established systematic interview discipline across multiple personas.',
        achievedAt: validRecords[4].session.startedAt,
        category: 'consistency',
      });
    }

    // Check for high score breakthrough
    const highScorers = validRecords.filter((r) => r.score >= 80);
    if (highScorers.length > 0) {
      milestones.push({
        id: 'ms-score-80',
        title: '80+ High Score Breakthrough',
        description: `Achieved score ${highScorers[0].score}/100 in ${highScorers[0].session.personaName || 'Practice'} simulation.`,
        achievedAt: highScorers[0].session.startedAt,
        category: 'skill_breakthrough',
      });
    }

    return milestones;
  }

  // --- Next Practice Recommendation ---

  private static generateNextPracticeRecommendation(p: {
    validRecords: ResolvedSessionEval[];
    recurringWeaknesses: RecurringWeakness[];
    weakestSkill?: { label: string; score: number };
    discoveryRecords: ResolvedSessionEval[];
    pitchRecords: ResolvedSessionEval[];
  }): NextPracticeRecommendation {
    const { validRecords, recurringWeaknesses, weakestSkill, discoveryRecords, pitchRecords } = p;

    // Default if no history
    if (validRecords.length === 0) {
      return {
        module: 'discovery',
        personaId: 'skeptic',
        personaName: 'The Skeptic',
        targetDifficulty: 'moderate',
        primaryFocus: 'Uncover baseline workflow & past friction',
        rationale: 'Start with a skeptical customer persona to master neutral past-behavior questioning.',
        targetSkill: 'Question Quality',
        suggestedAction: '/discovery/new',
      };
    }

    // Priority 1: Address recurring weakness
    const activeWeakness = recurringWeaknesses.find((w) => w.status === 'RECURRING' || w.status === 'EMERGING');
    if (activeWeakness) {
      return {
        module: activeWeakness.category,
        personaId: activeWeakness.recommendedPersonaId || (activeWeakness.category === 'discovery' ? 'skeptic' : 'numbers-focused'),
        personaName: activeWeakness.category === 'discovery' ? 'The Skeptic' : 'The Metrics VC',
        targetDifficulty: activeWeakness.recommendedDifficulty || 'moderate',
        primaryFocus: activeWeakness.title,
        rationale: activeWeakness.description,
        targetSkill: activeWeakness.title,
        suggestedAction: activeWeakness.category === 'discovery' ? '/discovery/new' : '/pitch/new',
      };
    }

    // Priority 2: Balance module coverage
    if (discoveryRecords.length > 0 && pitchRecords.length === 0) {
      return {
        module: 'pitch',
        personaId: 'numbers-focused',
        personaName: 'The Metrics VC',
        targetDifficulty: 'moderate',
        primaryFocus: 'Unit Economics Defense',
        rationale: 'You have solid Discovery practice. Rehearse your CAC/LTV and traction defense against an investor.',
        targetSkill: 'Traction Understanding',
        suggestedAction: '/pitch/new',
      };
    }

    // Priority 3: Level up difficulty if consistently high scores
    const latestScore = validRecords[validRecords.length - 1].score;
    if (latestScore >= 78) {
      return {
        module: 'discovery',
        personaId: 'busy-exec',
        personaName: 'The Busy Executive',
        targetDifficulty: 'hard',
        primaryFocus: 'Fast Value & Low-Patience Navigation',
        rationale: 'You are consistently scoring high. Challenge yourself against an impatient stakeholder.',
        targetSkill: 'Conciseness & Value Probing',
        suggestedAction: '/discovery/new',
      };
    }

    return {
      module: 'discovery',
      personaId: 'skeptic',
      personaName: 'The Skeptic',
      targetDifficulty: 'moderate',
      primaryFocus: weakestSkill?.label || 'Question Quality',
      rationale: `Targeted rehearsal to improve ${weakestSkill?.label || 'core skills'} against an authentic persona.`,
      targetSkill: weakestSkill?.label || 'Question Quality',
      suggestedAction: '/discovery/new',
    };
  }

  // --- Contextual Coaching Summary Synthesis ---

  private static generateCoachingSummary(p: {
    dataSufficiency: FounderProgressReport['dataSufficiency'];
    overallScoreTrend: TrendDirection;
    overallScoreChange: number;
    strongestSkill?: { label: string; score: number };
    weakestSkill?: { label: string; score: number };
    recurringWeaknesses: RecurringWeakness[];
    discoveryCount: number;
    pitchCount: number;
  }): string {
    const { dataSufficiency, overallScoreTrend, overallScoreChange, strongestSkill, weakestSkill, recurringWeaknesses } = p;

    if (dataSufficiency === 'ZERO_SESSIONS') {
      return 'Welcome to VentureCue Analytics. Complete your first practice interview to generate personalized skill trends and weakness detection.';
    }

    if (dataSufficiency === 'SINGLE_SESSION') {
      return 'Initial baseline recorded. Complete additional sessions across customer or investor personas to unlock multi-turn trajectory analytics.';
    }

    const activeWeakness = recurringWeaknesses[0];
    let summary = '';

    if (overallScoreTrend === 'IMPROVING') {
      summary += `Your performance is trending upward (+${overallScoreChange} pts across recent sessions), driven by strong ${strongestSkill?.label || 'engagement'}. `;
    } else if (overallScoreTrend === 'DECLINING') {
      summary += `Recent scores show increased challenge as difficulty scaled. `;
    } else {
      summary += `Your practice performance remains stable with consistent execution in ${strongestSkill?.label || 'core dimensions'}. `;
    }

    if (activeWeakness) {
      summary += `${activeWeakness.title} appeared across ${activeWeakness.frequency}/${activeWeakness.totalSessionsEvaluated} sessions—focus on ${activeWeakness.recommendedPractice.toLowerCase()}`;
    } else if (weakestSkill) {
      summary += `Primary growth opportunity is sharpening ${weakestSkill.label} in your upcoming drill.`;
    }

    return summary;
  }
}
