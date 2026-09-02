import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ExternalLink, Clock } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { EmptyState } from '../../components/shared/States';
import './SessionsPage.css';

type Filter = 'all' | 'discovery' | 'pitch';

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatDuration = (s?: number) => {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
};

export const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions } = useSessionStore();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = sessions.filter((s) => filter === 'all' || s.type === filter);

  return (
    <div className="sessions-page">
      <div className="sessions-page__header">
        <h1>Practice Session History</h1>
        <p>Review debrief reports, track readiness trends, and repeat high-friction conversations.</p>
      </div>

      <div className="sessions-page__filters" role="group" aria-label="Filter sessions">
        {(['all', 'discovery', 'pitch'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`sessions-filter ${filter === f ? 'sessions-filter--active' : ''}`}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f === 'all' ? 'All sessions' : f === 'discovery' ? 'Customer Discovery' : 'Investor Pitch'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Clock size={32} />}
          title={filter === 'all' ? 'No practice sessions recorded' : `No ${filter} sessions recorded`}
          description="Complete a simulation session to review in-depth feedback and performance metrics."
          action={{
            label: filter === 'pitch' ? 'Start Investor Pitch Session' : 'Start Customer Discovery Session',
            onClick: () => navigate(filter === 'pitch' ? '/pitch/new' : '/discovery/new'),
          }}
        />
      ) : (
        <div className="sessions-page__list">
          {filtered.map((session) => {
            const weakness = session.debrief?.weakMoments[0]?.label || 'General conversation flow';
            return (
              <div key={session.id} className="session-row">
                <div className="session-row__left">
                  <Badge variant={session.type === 'discovery' ? 'discovery' : 'pitch'} size="sm">
                    {session.type === 'discovery' ? 'Discovery' : 'Pitch'}
                  </Badge>
                  <div className="session-row__info">
                    <div className="session-row__persona-row">
                      <span className="session-row__persona">{session.personaName}</span>
                      <span className="session-row__diff-tag">{session.difficulty.toUpperCase()}</span>
                    </div>
                    <span className="session-row__meta">
                      {formatDate(session.startedAt)} · {formatDuration(session.durationSeconds)} · {session.startupName || 'Your Startup'}
                    </span>
                    <span className="session-row__weakness">
                      <strong>Primary weakness:</strong> {weakness}
                    </span>
                  </div>
                </div>

                <div className="session-row__right">
                  {session.debrief && (
                    <div className="session-row__score-block">
                      <ScoreRing
                        score={session.debrief.score.overall}
                        size={52}
                        strokeWidth={5}
                        animated={false}
                      />
                    </div>
                  )}
                  <div className="session-row__actions">
                    {session.debrief && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<ExternalLink size={13} />}
                        onClick={() => navigate(`/${session.type}/debrief/${session.id}`)}
                      >
                        Debrief
                      </Button>
                    )}
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
    </div>
  );
};
