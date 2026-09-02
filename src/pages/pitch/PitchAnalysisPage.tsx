import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, TrendingUp, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { usePitchStore } from '../../store/pitchStore';
import { getPersonaById } from '../../data/personas';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/shared/States';
import './PitchAnalysisPage.css';

const SEVERITY_VARIANT: Record<string, 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
};

export const PitchAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentSetup, isAnalyzing } = usePitchStore();

  const persona = currentSetup?.personaId ? getPersonaById(currentSetup.personaId) : null;
  const analysis = currentSetup?.analysis;

  if (isAnalyzing) {
    return (
      <div style={{ padding: 'var(--space-16)' }}>
        <LoadingState message="Analyzing your pitch for potential investor questions…" />
      </div>
    );
  }

  const handleStart = () => {
    navigate(`/pitch/session/${id ?? currentSetup?.id ?? 'demo'}`);
  };

  return (
    <div className="analysis-page">
      <div className="analysis-page__inner">
        <div className="analysis-page__header">
          <Badge variant="pitch">Investor Pitch</Badge>
          <h1 className="analysis-page__title">Pitch Analysis</h1>
          <p className="analysis-page__subtitle">
            Before you start, here's what an investor like <strong>{persona?.name ?? 'your selected investor'}</strong> is likely to focus on.
          </p>
        </div>

        {analysis && (
          <>
            <div className="analysis-page__grid">
              {/* Strengths */}
              <Card variant="elevated">
                <div className="analysis-section__header">
                  <TrendingUp size={16} className="analysis-icon--success" />
                  <h2>Strong points</h2>
                </div>
                <div className="analysis-section__list">
                  {analysis.strengths.map(s => (
                    <div key={s.id} className="analysis-item analysis-item--success">
                      <span className="analysis-item__area">{s.area}</span>
                      <p className="analysis-item__desc">{s.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Concerns */}
              <Card variant="elevated">
                <div className="analysis-section__header">
                  <AlertCircle size={16} className="analysis-icon--warning" />
                  <h2>Potential investor concerns</h2>
                </div>
                <div className="analysis-section__list">
                  {analysis.concerns.map(c => (
                    <div key={c.id} className={`analysis-item analysis-item--${c.severity}`}>
                      <div className="analysis-item__header">
                        <span className="analysis-item__area">{c.area}</span>
                        <Badge variant={SEVERITY_VARIANT[c.severity]} size="sm">{c.severity}</Badge>
                      </div>
                      <p className="analysis-item__desc">{c.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Missing info */}
              {analysis.missingInfo.length > 0 && (
                <Card variant="elevated">
                  <div className="analysis-section__header">
                    <Info size={16} className="analysis-icon--info" />
                    <h2>Missing information</h2>
                  </div>
                  <ul className="analysis-section__bullet-list">
                    {analysis.missingInfo.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Likely questions */}
              <Card variant="elevated">
                <div className="analysis-section__header">
                  <HelpCircle size={16} className="analysis-icon--brand" />
                  <h2>Likely question areas</h2>
                </div>
                <ul className="analysis-section__bullet-list">
                  {analysis.likelyQuestionAreas.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Claims needing evidence */}
            {analysis.claimsNeedingEvidence.length > 0 && (
              <Card variant="glass" className="analysis-page__claims">
                <h2 className="analysis-claims__title">Claims likely to be challenged</h2>
                <p className="analysis-claims__sub">Be ready to back these up with data or examples.</p>
                <ul className="analysis-section__bullet-list">
                  {analysis.claimsNeedingEvidence.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}

        <div className="analysis-page__start">
          <Button variant="primary" size="lg" glow rightIcon={<ArrowRight size={18} />} onClick={handleStart}>
            Start investor session
          </Button>
          <p className="analysis-page__start-note">Questions will adapt based on your answers in real time.</p>
        </div>
      </div>
    </div>
  );
};
