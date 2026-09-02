/**
 * VentureCue — Founder Progress, Analytics & Personalized Improvement Page
 * Provides multi-session performance intelligence, skill trajectories, recurring weakness tracking,
 * and adaptive practice recommendations derived from persisted sessions and human reviews.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ShieldCheck,
  Target,
  AlertTriangle,
  Award,
  ChevronRight,
  ArrowRight,
  Filter,
  Calendar,
  Users,
  Briefcase,
  Play,
  RotateCcw,
  Info,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { useReviewStore } from '../../store/reviewStore';
import { ProgressAnalyticsService, type ProgressFilterOptions } from '../../services/analytics/ProgressAnalyticsService';
import { TrustBadge } from '../../components/ui/TrustBadges';
import { Button } from '../../components/ui/Button';
import './ProgressPage.css';

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, deleteSession, clearAllSessions } = useSessionStore();
  const { reviews, deleteReviewBySessionId, clearAllReviews } = useReviewStore();

  const [moduleFilter, setModuleFilter] = useState<'all' | 'discovery' | 'pitch'>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | '30d' | '90d'>('all');
  const [selectedSkillKey, setSelectedSkillKey] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Generate dynamic report
  const report = useMemo(() => {
    return ProgressAnalyticsService.generateReport({
      sessions,
      reviews,
      filters: {
        module: moduleFilter,
        timeframe: timeframeFilter,
      },
    });
  }, [sessions, reviews, moduleFilter, timeframeFilter]);

  const activeSkills = useMemo(() => {
    if (moduleFilter === 'discovery') return report.discoverySkills;
    if (moduleFilter === 'pitch') return report.pitchSkills;
    return [...report.discoverySkills, ...report.pitchSkills];
  }, [moduleFilter, report]);

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    deleteReviewBySessionId(sessionId);
    setSessionToDelete(null);
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'IMPROVING' || change > 0) {
      return <TrendingUp size={14} className="trend-icon trend-icon--up" />;
    }
    if (trend === 'DECLINING' || change < 0) {
      return <TrendingDown size={14} className="trend-icon trend-icon--down" />;
    }
    return <Minus size={14} className="trend-icon trend-icon--neutral" />;
  };

  const getTrendBadge = (trend: string, change: number) => {
    if (trend === 'IMPROVING' || change > 0) {
      return (
        <span className="prog-trend-pill prog-trend-pill--up">
          <TrendingUp size={11} />
          <span>+{change} pts (Improving)</span>
        </span>
      );
    }
    if (trend === 'DECLINING' || change < 0) {
      return (
        <span className="prog-trend-pill prog-trend-pill--down">
          <TrendingDown size={11} />
          <span>{change} pts (Declining)</span>
        </span>
      );
    }
    if (trend === 'STABLE') {
      return (
        <span className="prog-trend-pill prog-trend-pill--neutral">
          <Minus size={11} />
          <span>Stable</span>
        </span>
      );
    }
    return (
      <span className="prog-trend-pill prog-trend-pill--insufficient">
        <Info size={11} />
        <span>Preliminary</span>
      </span>
    );
  };

  // Empty State
  if (report.totalSessions === 0) {
    return (
      <div className="progress-page animate-fade-in">
        <div className="prog-header">
          <div>
            <h1 className="prog-header__title">Founder Progress &amp; Analytics</h1>
            <p className="prog-header__subtitle">
              Continuous performance intelligence derived from practice workouts and coach reviews.
            </p>
          </div>
        </div>

        <div className="prog-empty-state animate-scale-in">
          <div className="prog-empty-icon">
            <Target size={44} />
          </div>
          <h2>No Practice History Yet</h2>
          <p>
            Complete your first Customer Discovery or Investor Pitch session to unlock personalized skill trajectory tracking, recurring weakness detection, and adaptive coaching drills.
          </p>
          <div className="prog-empty-actions">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Play size={16} />}
              onClick={() => navigate('/discovery/new')}
            >
              Start Customer Discovery Practice
            </Button>
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Briefcase size={16} />}
              onClick={() => navigate('/pitch/new')}
            >
              Start Investor Pitch Practice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-page animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="prog-header">
        <div>
          <div className="prog-header__badge-row">
            <span className="prog-badge">FOUNDER INTELLIGENCE</span>
            <span className="prog-provenance-count">
              <ShieldCheck size={12} />
              {report.humanReviewedCount} Human Reviewed • {report.aiOnlyCount} AI Provisional
            </span>
          </div>
          <h1 className="prog-header__title">Performance Trajectory &amp; Weakness Analytics</h1>
          <p className="prog-header__subtitle">
            Evidence-based skill progression across simulated customer discovery and investor pitch workouts.
          </p>
        </div>

        {/* Filters */}
        <div className="prog-filters">
          <div className="prog-filter-group" role="radiogroup" aria-label="Module filter">
            <button
              type="button"
              className={`prog-filter-btn ${moduleFilter === 'all' ? 'prog-filter-btn--active' : ''}`}
              onClick={() => setModuleFilter('all')}
            >
              All Modules ({report.totalSessions})
            </button>
            <button
              type="button"
              className={`prog-filter-btn ${moduleFilter === 'discovery' ? 'prog-filter-btn--active' : ''}`}
              onClick={() => setModuleFilter('discovery')}
            >
              Customer Discovery ({report.discoverySessionsCount})
            </button>
            <button
              type="button"
              className={`prog-filter-btn ${moduleFilter === 'pitch' ? 'prog-filter-btn--active' : ''}`}
              onClick={() => setModuleFilter('pitch')}
            >
              Investor Pitch ({report.pitchSessionsCount})
            </button>
          </div>

          <div className="prog-filter-group" role="radiogroup" aria-label="Timeframe filter">
            <button
              type="button"
              className={`prog-filter-btn ${timeframeFilter === 'all' ? 'prog-filter-btn--active' : ''}`}
              onClick={() => setTimeframeFilter('all')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`prog-filter-btn ${timeframeFilter === '30d' ? 'prog-filter-btn--active' : ''}`}
              onClick={() => setTimeframeFilter('30d')}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              className={`prog-filter-btn ${timeframeFilter === '90d' ? 'prog-filter-btn--active' : ''}`}
              onClick={() => setTimeframeFilter('90d')}
            >
              Last 90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Data Sufficiency Warning if only 1 session */}
      {report.dataSufficiency === 'SINGLE_SESSION' && (
        <div className="prog-sufficiency-banner animate-fade-in">
          <Info size={16} />
          <span>
            <strong>Baseline Session Recorded:</strong> Multi-turn trend indicators and recurring weakness detection require 2+ sessions. Keep practicing to unlock complete trend intelligence.
          </span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="prog-stat-grid">
        <div className="prog-stat-card">
          <div className="prog-stat-header">
            <span className="prog-stat-label">Total Practice Runs</span>
            <Target size={16} className="prog-stat-icon" />
          </div>
          <div className="prog-stat-value">{report.totalSessions}</div>
          <div className="prog-stat-footer">
            <span>{report.discoverySessionsCount} Discovery • {report.pitchSessionsCount} Pitch</span>
          </div>
        </div>

        <div className="prog-stat-card">
          <div className="prog-stat-header">
            <span className="prog-stat-label">Average Score</span>
            <Sparkles size={16} className="prog-stat-icon" />
          </div>
          <div className="prog-stat-value">
            {report.overallAverageScore}
            <span className="prog-stat-unit">/100</span>
          </div>
          <div className="prog-stat-footer">
            {getTrendBadge(report.overallScoreTrend, report.overallScoreChange)}
          </div>
        </div>

        <div className="prog-stat-card">
          <div className="prog-stat-header">
            <span className="prog-stat-label">Top Strength</span>
            <Award size={16} className="prog-stat-icon prog-stat-icon--gold" />
          </div>
          <div className="prog-stat-highlight">
            {report.strongestSkill?.label || 'General Readiness'}
          </div>
          <div className="prog-stat-footer">
            <span>Consistent score: <strong>{report.strongestSkill?.score || 75}/100</strong></span>
          </div>
        </div>

        <div className="prog-stat-card">
          <div className="prog-stat-header">
            <span className="prog-stat-label">Primary Focus Area</span>
            <AlertTriangle size={16} className="prog-stat-icon prog-stat-icon--amber" />
          </div>
          <div className="prog-stat-highlight prog-stat-highlight--focus">
            {report.weakestSkill?.label || 'Question Quality'}
          </div>
          <div className="prog-stat-footer">
            <span>Current benchmark: <strong>{report.weakestSkill?.score || 60}/100</strong></span>
          </div>
        </div>
      </div>

      {/* Personalized Coaching & Recommended Next Practice Hero */}
      <div className="prog-hero-coach-card">
        <div className="prog-coach-content">
          <div className="prog-coach-tag">
            <Sparkles size={13} />
            <span>AI COACHING SYNTHESIS</span>
          </div>
          <h2 className="prog-coach-heading">Your Performance Diagnosis</h2>
          <p className="prog-coach-summary">{report.personalizedCoachingSummary}</p>
        </div>

        <div className="prog-next-drill-card">
          <div className="prog-drill-header">
            <span className="prog-drill-badge">RECOMMENDED NEXT PRACTICE</span>
            <span className="prog-drill-diff">
              {report.nextPracticeRecommendation.targetDifficulty.toUpperCase()}
            </span>
          </div>
          <h3 className="prog-drill-title">
            {report.nextPracticeRecommendation.module === 'discovery' ? 'Customer Discovery' : 'Investor Pitch'} with{' '}
            {report.nextPracticeRecommendation.personaName}
          </h3>
          <p className="prog-drill-focus">
            <strong>Target Focus:</strong> {report.nextPracticeRecommendation.primaryFocus}
          </p>
          <p className="prog-drill-rationale">{report.nextPracticeRecommendation.rationale}</p>
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight size={15} />}
            onClick={() => navigate(report.nextPracticeRecommendation.suggestedAction)}
          >
            Start Recommended Drill
          </Button>
        </div>
      </div>

      {/* Main Content Grid: Skill Dimensions vs Recurring Weaknesses */}
      <div className="prog-main-grid">
        {/* Left Column: Skill Trajectories */}
        <div className="prog-card">
          <div className="prog-card-header">
            <div>
              <h2 className="prog-card-title">Skill Trajectories</h2>
              <p className="prog-card-subtitle">
                Historical scores across essential founder conversation competencies.
              </p>
            </div>
          </div>

          <div className="prog-skills-list">
            {activeSkills.map((skill) => (
              <div key={skill.skillKey} className="prog-skill-item">
                <div className="prog-skill-meta">
                  <div className="prog-skill-label-wrap">
                    <span className="prog-skill-label">{skill.label}</span>
                    <span className="prog-skill-module-tag">{skill.module.toUpperCase()}</span>
                  </div>
                  <div className="prog-skill-score-wrap">
                    <span className="prog-skill-current-score">{skill.currentScore}</span>
                    <span className="prog-skill-score-max">/100</span>
                    {getTrendBadge(skill.trend, skill.change)}
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="prog-skill-bar-track">
                  <div
                    className={`prog-skill-bar-fill ${
                      skill.currentScore >= 75
                        ? 'prog-skill-bar-fill--green'
                        : skill.currentScore >= 60
                        ? 'prog-skill-bar-fill--blue'
                        : 'prog-skill-bar-fill--amber'
                    }`}
                    style={{ width: `${Math.max(8, skill.currentScore)}%` }}
                  />
                </div>

                {/* Score History Trail */}
                {skill.history.length > 1 && (
                  <div className="prog-skill-history-trail">
                    <span className="prog-history-label">Session Trail:</span>
                    <div className="prog-history-chips">
                      {skill.history.map((pt, idx) => (
                        <span key={pt.sessionId} className="prog-history-chip">
                          {pt.score}
                          {idx < skill.history.length - 1 && <span className="prog-chip-arrow">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recurring Weaknesses & Strengths */}
        <div className="prog-side-col">
          {/* Recurring Weaknesses Card */}
          <div className="prog-card">
            <div className="prog-card-header">
              <div>
                <h2 className="prog-card-title">Recurring Weakness Intelligence</h2>
                <p className="prog-card-subtitle">
                  Friction patterns detected across 2+ practice sessions.
                </p>
              </div>
            </div>

            <div className="prog-weakness-list">
              {report.recurringWeaknesses.length === 0 ? (
                <div className="prog-no-weakness">
                  <CheckCircle2 size={24} className="prog-no-wk-icon" />
                  <p>No recurring weaknesses detected across your active session history.</p>
                </div>
              ) : (
                report.recurringWeaknesses.map((wk) => (
                  <div key={wk.id} className="prog-weakness-card">
                    <div className="prog-weakness-header">
                      <div className="prog-weakness-title-wrap">
                        <AlertTriangle size={15} className="prog-wk-icon" />
                        <h4 className="prog-weakness-title">{wk.title}</h4>
                      </div>
                      <span
                        className={`prog-wk-status-pill ${
                          wk.status === 'RECURRING'
                            ? 'prog-wk-status-pill--recurring'
                            : 'prog-wk-status-pill--emerging'
                        }`}
                      >
                        {wk.status} ({wk.frequency}/{wk.totalSessionsEvaluated} Sessions)
                      </span>
                    </div>

                    <p className="prog-weakness-desc">{wk.description}</p>

                    {/* Occurrence History */}
                    {wk.occurrences.length > 1 && (
                      <div className="prog-wk-occurrences">
                        <span className="prog-wk-occ-label">Occurrence Count:</span>
                        <div className="prog-wk-occ-trail">
                          {wk.occurrences.map((cnt, i) => (
                            <span key={i} className="prog-occ-num">
                              {cnt}
                              {i < wk.occurrences.length - 1 && <span>→</span>}
                            </span>
                          ))}
                          <span
                            className={`prog-wk-trend-tag ${
                              wk.trendDirection === 'IMPROVING'
                                ? 'prog-wk-trend-tag--improving'
                                : 'prog-wk-trend-tag--worsening'
                            }`}
                          >
                            {wk.trendDirection}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="prog-wk-action">
                      <strong>Recommended Drill:</strong> {wk.recommendedPractice}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Consistently Strong Areas */}
          <div className="prog-card">
            <div className="prog-card-header">
              <h2 className="prog-card-title">Top Strengths</h2>
            </div>
            <div className="prog-strengths-list">
              {report.topStrengths.map((str) => (
                <div key={str.id} className="prog-strength-item">
                  <div className="prog-str-icon-wrap">
                    <Award size={16} />
                  </div>
                  <div>
                    <h4 className="prog-str-title">{str.title}</h4>
                    <p className="prog-str-desc">{str.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Persona Performance Breakdown Matrix */}
      {report.personaBreakdowns.length > 0 && (
        <div className="prog-card">
          <div className="prog-card-header">
            <div>
              <h2 className="prog-card-title">Persona Performance Matrix</h2>
              <p className="prog-card-subtitle">
                Understanding how your interview style performs against specific customer and investor archetypes.
              </p>
            </div>
          </div>

          <div className="prog-persona-grid">
            {report.personaBreakdowns.map((p) => (
              <div key={p.personaId} className="prog-persona-card">
                <div className="prog-persona-header">
                  <span className="prog-persona-name">{p.personaName}</span>
                  <span className="prog-persona-module-tag">{p.module.toUpperCase()}</span>
                </div>
                <div className="prog-persona-score-row">
                  <div>
                    <span className="prog-persona-score">{p.averageScore}</span>
                    <span className="prog-persona-unit">/100 avg</span>
                  </div>
                  <span className="prog-persona-runs">
                    {p.sessionsCount} session{p.sessionsCount > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="prog-persona-obs">{p.keyObservation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History Table with Direct Debrief Access */}
      <div className="prog-card">
        <div className="prog-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="prog-card-title">Session Practice History</h2>
            <p className="prog-card-subtitle">
              Detailed breakdown of all recorded workouts and human review decisions.
            </p>
          </div>
          {sessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => setShowClearAllModal(true)}
              style={{ color: 'var(--status-danger)' }}
            >
              Clear All Records
            </Button>
          )}
        </div>

        <div className="prog-table-wrap">
          <table className="prog-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Persona</th>
                <th>Difficulty</th>
                <th>Score</th>
                <th>Provenance</th>
                <th>Key Strength / Focus</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions
                .filter((s) => {
                  if (moduleFilter === 'discovery' && s.type !== 'discovery') return false;
                  if (moduleFilter === 'pitch' && s.type !== 'pitch') return false;
                  return true;
                })
                .map((session) => {
                  const review = reviews.find((r) => r.sessionId === session.id);
                  const isRejected = review?.reviewStatus === 'REJECTED';
                  const finalScore = review?.finalEvaluation?.score?.overall ?? session.debrief?.score?.overall ?? 0;
                  const originalScore = review?.originalEvaluation?.score?.overall ?? session.debrief?.score?.overall ?? 0;
                  const hasDiff = review?.reviewStatus === 'EDITED' && finalScore !== originalScore;

                  const debriefRoute =
                    session.type === 'discovery'
                      ? `/discovery/${session.id}/debrief`
                      : `/pitch/${session.id}/debrief`;

                  return (
                    <tr key={session.id} className={isRejected ? 'prog-row--rejected' : ''}>
                      <td>
                        <div className="prog-date-cell">
                          <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                          <span className="prog-time-sub">
                            {new Date(session.startedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="prog-type-pill">
                          {session.type === 'discovery' ? 'Discovery' : 'Pitch'}
                        </span>
                      </td>
                      <td>
                        <strong>{session.personaName || 'Persona'}</strong>
                      </td>
                      <td>
                        <span className="prog-diff-pill">
                          {(session.difficulty || 'moderate').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="prog-score-cell">
                          <span className="prog-final-score">{finalScore}</span>
                          {hasDiff && (
                            <span className="prog-score-delta-chip">
                              AI: {originalScore} → {finalScore}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {review?.reviewStatus === 'ACCEPTED' ? (
                          <TrustBadge type="human-reviewed" size="sm" reviewerName={review.reviewerName} />
                        ) : review?.reviewStatus === 'EDITED' ? (
                          <TrustBadge type="human-edited" size="sm" />
                        ) : review?.reviewStatus === 'REJECTED' ? (
                          <TrustBadge type="ai-rejected" size="sm" />
                        ) : (
                          <TrustBadge type="ai-generated" size="sm" />
                        )}
                      </td>
                      <td className="prog-moment-cell">
                        {session.debrief?.strongMoments?.[0]?.label ||
                          session.debrief?.summary?.slice(0, 45) ||
                          'Completed practice run'}
                      </td>
                      <td>
                        <div className="prog-row-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(debriefRoute)}
                          >
                            View Debrief
                          </Button>
                          <button
                            type="button"
                            className="prog-delete-btn"
                            title="Delete session data"
                            onClick={() => setSessionToDelete(session.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="prog-modal-backdrop animate-fade-in" onClick={() => setSessionToDelete(null)}>
          <div className="prog-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="prog-modal-header">
              <AlertTriangle size={20} className="prog-modal-warn-icon" />
              <h3>Delete Practice Session Data</h3>
            </div>
            <p className="prog-modal-body">
              Are you sure you want to delete this session? The transcript, AI diagnosis, and associated human review records will be permanently removed.
            </p>
            <div className="prog-modal-footer">
              <Button variant="secondary" size="md" onClick={() => setSessionToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => handleDeleteSession(sessionToDelete)}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllModal && (
        <div className="prog-modal-backdrop animate-fade-in" onClick={() => setShowClearAllModal(false)}>
          <div className="prog-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="prog-modal-header">
              <AlertTriangle size={20} className="prog-modal-warn-icon" />
              <h3>Clear All Practice Records</h3>
            </div>
            <p className="prog-modal-body">
              Are you sure you want to clear all practice sessions and reviews? Your workout history and analytics will be reset to a fresh blank slate.
            </p>
            <div className="prog-modal-footer">
              <Button variant="secondary" size="md" onClick={() => setShowClearAllModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  clearAllSessions();
                  clearAllReviews();
                  setShowClearAllModal(false);
                }}
              >
                Clear All History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
