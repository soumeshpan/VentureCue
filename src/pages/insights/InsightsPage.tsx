import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/shared/States';
import './InsightsPage.css';

interface InsightItem {
  id: string;
  type: 'attention' | 'coaching' | 'positive';
  categoryLabel: string;
  title: string;
  description: string;
}

export const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions } = useSessionStore();

  if (sessions.length === 0) {
    return (
      <div className="insights-page">
        <EmptyState
          icon={<Lightbulb size={32} />}
          title="No practice data yet"
          description="Complete at least one Customer Discovery or Investor Pitch session to unlock personalized coaching insights."
          action={{
            label: 'Start Customer Discovery Session',
            onClick: () => navigate('/discovery/new'),
          }}
        />
      </div>
    );
  }

  const discoverySessions = sessions.filter((s) => s.type === 'discovery');
  const pitchSessions = sessions.filter((s) => s.type === 'pitch');

  const totalSessions = sessions.length;
  const totalDiscoverySessions = discoverySessions.length;
  const totalPitchSessions = pitchSessions.length;

  const validScores = sessions
    .map((s) => s.debrief?.score.overall)
    .filter((sc): sc is number => typeof sc === 'number');
  const averageOverallScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 72;

  // Calculate dynamic discovery metrics
  const leadingQuestionCounts = discoverySessions.map((s) => s.debrief?.score.leadingQuestions || 0);
  const totalLeadingQuestions = leadingQuestionCounts.reduce((a, b) => a + b, 0);

  const discoveryScores = discoverySessions.map((s) => s.debrief?.score.discoveryQuality || 70);
  const avgDiscoveryQuality =
    discoveryScores.length > 0
      ? Math.round(discoveryScores.reduce((a, b) => a + b, 0) / discoveryScores.length)
      : 70;

  const questionScores = discoverySessions.map((s) => s.debrief?.score.questionQuality || 68);
  const avgQuestionQuality =
    questionScores.length > 0
      ? Math.round(questionScores.reduce((a, b) => a + b, 0) / questionScores.length)
      : 68;

  const listeningScores = discoverySessions.map((s) => s.debrief?.score.listeningQuality || 75);
  const avgListeningQuality =
    listeningScores.length > 0
      ? Math.round(listeningScores.reduce((a, b) => a + b, 0) / listeningScores.length)
      : 75;

  const evidenceScores = discoverySessions.map((s) => s.debrief?.score.evidenceGathering || 65);
  const avgEvidenceQuality =
    evidenceScores.length > 0
      ? Math.round(evidenceScores.reduce((a, b) => a + b, 0) / evidenceScores.length)
      : 65;

  const followUpScores = discoverySessions.map((s) => s.debrief?.score.followUpQuality || 72);
  const avgFollowUpQuality =
    followUpScores.length > 0
      ? Math.round(followUpScores.reduce((a, b) => a + b, 0) / followUpScores.length)
      : 72;

  const assumptionScores = discoverySessions.map((s) => s.debrief?.score.goalCoverage || 78);
  const avgAssumptionAvoidance =
    assumptionScores.length > 0
      ? Math.round(assumptionScores.reduce((a, b) => a + b, 0) / assumptionScores.length)
      : 78;

  // Construct Categorized Findings (Fixing Semantic Icon Contradictions)
  const findings: InsightItem[] = [];

  if (totalLeadingQuestions > 0) {
    findings.push({
      id: 'ins-lead',
      type: 'attention',
      categoryLabel: 'ATTENTION',
      title: `Leading questions detected in ${leadingQuestionCounts.filter((c) => c > 0).length} of your last ${discoverySessions.length} sessions.`,
      description:
        'You frequently introduce your expected solution into questions. Replace hypothetical framing with past-tense story prompts.',
    });
  }

  if (avgEvidenceQuality < 75) {
    findings.push({
      id: 'ins-coach',
      type: 'coaching',
      categoryLabel: 'COACHING OPPORTUNITY',
      title: 'Spend more time exploring how customers currently handle the problem.',
      description:
        'Uncover the exact tools, spreadsheets, and manual steps in their existing workflow before testing new solution ideas.',
    });
  }

  if (avgListeningQuality >= 70) {
    findings.push({
      id: 'ins-pos-listen',
      type: 'positive',
      categoryLabel: 'POSITIVE',
      title: 'Strong active listening and conversation pacing across recent sessions.',
      description:
        'You give the customer persona adequate space to describe their context without cutting them off prematurely.',
    });
  }

  if (totalLeadingQuestions === 0 && discoverySessions.length > 0) {
    findings.push({
      id: 'ins-pos-neutral',
      type: 'positive',
      categoryLabel: 'POSITIVE',
      title: 'High question neutrality maintained across discovery dialogues.',
      description:
        'You avoided leading questions and focused on uncovering raw evidence from the customer.',
    });
  }

  // Determine Actionable Weakest Area & Targeted Recommendation
  const weakestArea =
    avgQuestionQuality <= avgDiscoveryQuality && avgQuestionQuality <= avgEvidenceQuality
      ? {
          name: 'Open-Ended Question Neutrality',
          pattern: 'You frequently introduce your expected answer or feature ideas into interview questions.',
          action: 'Ask five neutral past-behavior questions ("Walk me through what happened...") without mentioning your proposed product.',
          targetRoute: '/discovery/new',
        }
      : avgEvidenceQuality <= avgDiscoveryQuality
      ? {
          name: 'Problem Exploration & Evidence Depth',
          pattern: 'You accept surface-level complaints without asking for concrete examples or quantifying the time/cost impact.',
          action: 'Ask for specific dollar amounts, wasted hours, or downstream consequences when the customer mentions friction.',
          targetRoute: '/discovery/new',
        }
      : {
          name: 'Discovery Methodology Discipline',
          pattern: 'You occasionally move between customer segments before establishing whether the core problem occurs frequently.',
          action: 'Rehearse an interview focused solely on uncovering the customer\'s top 3 operational priorities.',
          targetRoute: '/discovery/new',
        };

  return (
    <div className="insights-page">
      <div className="insights-page__header">
        <h1>Performance Insights &amp; Coaching</h1>
        <p>
          Data-driven patterns, skill breakdowns, and actionable practice recommendations across {totalSessions} session{totalSessions === 1 ? '' : 's'}.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="insights-page__stats">
        <div className="insights-stat">
          <span className="insights-stat__value">{totalSessions}</span>
          <span className="insights-stat__label">Total sessions</span>
        </div>
        <div className="insights-stat">
          <span className="insights-stat__value">{totalDiscoverySessions}</span>
          <span className="insights-stat__label">Discovery</span>
        </div>
        <div className="insights-stat">
          <span className="insights-stat__value">{totalPitchSessions}</span>
          <span className="insights-stat__label">Pitch</span>
        </div>
        <div className="insights-stat">
          <span className="insights-stat__value" style={{ color: 'var(--brand-primary)' }}>
            {averageOverallScore}
          </span>
          <span className="insights-stat__label">Avg. readiness</span>
        </div>
      </div>

      {/* Actionable Weakest Area Recommendation Card */}
      <Card variant="brand" className="insights-action-card">
        <div className="insights-action-card__top">
          <div className="insights-action-card__badge">
            <Zap size={14} />
            <span>PRIMARY PRACTICE FOCUS</span>
          </div>
          <span className="insights-action-card__target">Target: {weakestArea.name}</span>
        </div>

        <div className="insights-action-card__body">
          <div className="insights-action-card__col">
            <strong>Pattern detected:</strong>
            <p>{weakestArea.pattern}</p>
          </div>
          <div className="insights-action-card__col">
            <strong>Practice next:</strong>
            <p>{weakestArea.action}</p>
          </div>
        </div>

        <div className="insights-action-card__footer">
          <Button
            variant="primary"
            size="md"
            glow
            rightIcon={<ArrowRight size={16} />}
            onClick={() => navigate(weakestArea.targetRoute)}
          >
            Practice this skill now
          </Button>
        </div>
      </Card>

      {/* Categorized Findings */}
      <section aria-labelledby="findings-title">
        <h2 id="findings-title" className="insights-page__section-title">
          Conversational Patterns &amp; Diagnostics
        </h2>
        <div className="insights-findings-list">
          {findings.map((item) => (
            <div
              key={item.id}
              className={`insights-finding-card insights-finding-card--${item.type}`}
            >
              <div className="insights-finding-card__header">
                {item.type === 'attention' && (
                  <span className="insights-finding-badge insights-finding-badge--attention">
                    <AlertTriangle size={13} />
                    {item.categoryLabel}
                  </span>
                )}
                {item.type === 'coaching' && (
                  <span className="insights-finding-badge insights-finding-badge--coaching">
                    <Info size={13} />
                    {item.categoryLabel}
                  </span>
                )}
                {item.type === 'positive' && (
                  <span className="insights-finding-badge insights-finding-badge--positive">
                    <CheckCircle2 size={13} />
                    {item.categoryLabel}
                  </span>
                )}
              </div>
              <h3 className="insights-finding-card__title">{item.title}</h3>
              <p className="insights-finding-card__desc">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Discovery Mastery Breakdown */}
      {totalDiscoverySessions > 0 && (
        <section aria-labelledby="disc-metrics-title">
          <h2 id="disc-metrics-title" className="insights-page__section-title">
            Customer Discovery Mastery Breakdown
          </h2>
          <Card variant="elevated" padding="lg">
            <div className="insights-metrics-grid">
              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Discovery Methodology Quality</span>
                  <span className="insights-metric__value">{avgDiscoveryQuality}%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: `${avgDiscoveryQuality}%` }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Open-Ended Question Neutrality</span>
                  <span className="insights-metric__value">{avgQuestionQuality}%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: `${avgQuestionQuality}%` }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Active Listening &amp; Empathy</span>
                  <span className="insights-metric__value">{avgListeningQuality}%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: `${avgListeningQuality}%` }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Problem Exploration Depth</span>
                  <span className="insights-metric__value">{avgEvidenceQuality}%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: `${avgEvidenceQuality}%` }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Follow-up Question Quality</span>
                  <span className="insights-metric__value">{avgFollowUpQuality}%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: `${avgFollowUpQuality}%` }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Assumption Avoidance</span>
                  <span className="insights-metric__value">{avgAssumptionAvoidance}%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: `${avgAssumptionAvoidance}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Investor Pitch Mastery Breakdown */}
      {totalPitchSessions > 0 && (
        <section aria-labelledby="pitch-metrics-title">
          <h2 id="pitch-metrics-title" className="insights-page__section-title">
            Investor Pitch Mastery Breakdown
          </h2>
          <Card variant="elevated" padding="lg">
            <div className="insights-metrics-grid">
              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Problem Clarity</span>
                  <span className="insights-metric__value">80%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: '80%' }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Solution Clarity</span>
                  <span className="insights-metric__value">78%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: '78%' }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Market Understanding</span>
                  <span className="insights-metric__value">72%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: '72%' }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Traction &amp; Evidence</span>
                  <span className="insights-metric__value">68%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: '68%' }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Business Model &amp; Unit Economics</span>
                  <span className="insights-metric__value">74%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: '74%' }} />
                </div>
              </div>

              <div className="insights-metric">
                <div className="insights-metric__header">
                  <span className="insights-metric__label">Objection Handling</span>
                  <span className="insights-metric__value">66%</span>
                </div>
                <div className="insights-metric__track">
                  <div className="insights-metric__fill" style={{ width: '66%' }} />
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
};
