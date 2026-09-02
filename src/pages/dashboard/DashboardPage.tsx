import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, ArrowRight, Clock, ChevronRight, RotateCcw, Zap, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { EmptyState } from '../../components/shared/States';
import './DashboardPage.css';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const formatDuration = (seconds?: number) => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sessions } = useSessionStore();

  const recentSessions = sessions.slice(0, 4);
  const firstName = user?.name?.split(' ')[0] ?? 'Founder';
  const greeting = getGreeting();

  const discoveryCount = sessions.filter((s) => s.type === 'discovery').length;
  const pitchCount = sessions.filter((s) => s.type === 'pitch').length;

  return (
    <div className="dashboard">
      {/* Header with time-aware greeting */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__greeting">{greeting}, {firstName}.</h1>
          <p className="dashboard__subtitle">
            {sessions.length === 0
              ? 'Prepare for high-stakes customer discovery and investor conversations.'
              : `You have completed ${sessions.length} simulated conversation${sessions.length !== 1 ? 's' : ''} across discovery and pitch prep.`}
          </p>
        </div>
      </div>

      {/* Practice Module Launchers */}
      <section className="dashboard__modules" aria-labelledby="modules-label">
        <h2 id="modules-label" className="dashboard__section-title">
          Choose Your Practice Area
        </h2>
        <div className="dashboard__module-grid">
          {/* Customer Discovery Card */}
          <Card variant="elevated" hoverable className="dashboard__module-card dashboard__module-card--discovery">
            <div className="dashboard__module-top">
              <div className="dashboard__module-icon dashboard__module-icon--discovery">
                <Users size={24} />
              </div>
              <Badge variant="discovery" size="sm">CUSTOMER DISCOVERY</Badge>
            </div>
            <div className="dashboard__module-content">
              <h3>Customer Discovery Simulation</h3>
              <p>Rehearse unscripted conversations with realistic customer archetypes before meeting real prospects.</p>
              <ul className="dashboard__module-hints">
                <li>Extract and validate core problem hypotheses</li>
                <li>Practice with Skeptics, Busy, and Frustrated customers</li>
                <li>Eliminate leading questions and premature pitching</li>
              </ul>
            </div>
            <Button
              variant="secondary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/discovery/new')}
            >
              Start Discovery Session
            </Button>
          </Card>

          {/* Investor Pitch Card */}
          <Card variant="elevated" hoverable className="dashboard__module-card dashboard__module-card--pitch">
            <div className="dashboard__module-top">
              <div className="dashboard__module-icon dashboard__module-icon--pitch">
                <TrendingUp size={24} />
              </div>
              <Badge variant="pitch" size="sm">INVESTOR PITCH</Badge>
            </div>
            <div className="dashboard__module-content">
              <h3>Investor Pitch Q&amp;A</h3>
              <p>Pressure-test your unit economics, defensibility, and market sizing before your partner meeting.</p>
              <ul className="dashboard__module-hints">
                <li>Input your deck and narrative claims</li>
                <li>Face tough VC and angel questioning styles</li>
                <li>Identify weak answers and missing evidence</li>
              </ul>
            </div>
            <Button
              variant="secondary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/pitch/new')}
            >
              Start Pitch Session
            </Button>
          </Card>
        </div>
      </section>

      {/* Recent Sessions */}
      <section className="dashboard__recent" aria-labelledby="recent-label">
        <div className="dashboard__section-header">
          <h2 id="recent-label" className="dashboard__section-title">
            Recent Practice Sessions
          </h2>
          {sessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ChevronRight size={14} />}
              onClick={() => navigate('/sessions')}
            >
              All sessions ({sessions.length})
            </Button>
          )}
        </div>

        {recentSessions.length === 0 ? (
          <EmptyState
            icon={<Clock size={32} />}
            title="No practice sessions yet"
            description="Start your first simulated conversation to unlock detailed debrief analytics."
            action={{ label: 'Start First Discovery Session', onClick: () => navigate('/discovery/new') }}
          />
        ) : (
          <div className="dashboard__session-list">
            {recentSessions.map((session) => {
              const weakness = session.debrief?.weakMoments[0]?.label || 'Good conversational discipline';
              return (
                <div key={session.id} className="dashboard__session-row">
                  <div className="dashboard__session-left">
                    <Badge variant={session.type === 'discovery' ? 'discovery' : 'pitch'} size="sm">
                      {session.type === 'discovery' ? 'Discovery' : 'Pitch'}
                    </Badge>
                    <div className="dashboard__session-info">
                      <div className="dashboard__session-persona-row">
                        <span className="dashboard__session-persona">{session.personaName}</span>
                        <span className="dashboard__session-diff-badge">{session.difficulty.toUpperCase()}</span>
                      </div>
                      <span className="dashboard__session-meta">
                        {formatDate(session.startedAt)} · {formatDuration(session.durationSeconds)} · {session.startupName || 'Your Startup'}
                      </span>
                      <span className="dashboard__session-weakness-tag">
                        <strong>Focus:</strong> {weakness}
                      </span>
                    </div>
                  </div>

                  <div className="dashboard__session-right">
                    {session.debrief && (
                      <ScoreRing
                        score={session.debrief.score.overall}
                        size={48}
                        strokeWidth={4.5}
                        animated={false}
                      />
                    )}
                    <div className="dashboard__session-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<ExternalLink size={13} />}
                        onClick={() => navigate(`/${session.type}/debrief/${session.id}`)}
                      >
                        Debrief
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<RotateCcw size={13} />}
                        onClick={() => navigate(`/${session.type}/new`)}
                      >
                        Practice again
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Key Insight Teaser */}
      {sessions.length > 0 && (
        <section className="dashboard__insight-teaser" aria-labelledby="insight-label">
          <div className="dashboard__section-header">
            <h2 id="insight-label" className="dashboard__section-title">
              Coaching &amp; Performance Trajectory
            </h2>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ChevronRight size={14} />}
              onClick={() => navigate('/progress')}
            >
              View Progress Trends
            </Button>
          </div>
          <Card variant="glass" className="dashboard__insight-card">
            <div className="dashboard__insight-inner">
              <div className="dashboard__insight-icon">
                <Zap size={20} />
              </div>
              <div>
                <p className="dashboard__insight-text">
                  "In customer discovery interviews, resist asking questions that contain the answer you want. Lead with past stories ('Walk me through what happened last week...')."
                </p>
                <div className="dashboard__insight-footer">
                  <span><strong>Next focus:</strong> Open-ended past-behavior inquiry</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/progress')}
                    >
                      Skill Analytics
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      glow
                      rightIcon={<ArrowRight size={14} />}
                      onClick={() => navigate('/discovery/new')}
                    >
                      Practice this skill
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
};
