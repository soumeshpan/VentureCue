import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  Target,
  ShieldAlert,
} from 'lucide-react';
import { useDiscoveryStore } from '../../store/discoveryStore';
import { getPersonaById } from '../../data/personas';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import './DiscoveryPrepPage.css';

const WHAT_TO_LOOK_FOR = [
  { label: 'Actual Past Behavior', desc: 'Stories of what happened last week rather than hypothetical future guesses.' },
  { label: 'Frequency & Trigger', desc: 'How often the friction occurs and what specific event triggers it.' },
  { label: 'Current Workarounds', desc: 'What tools, spreadsheets, or manual habits they currently tolerate.' },
  { label: 'Cost & Downstream Impact', desc: 'Wasted hours, lost revenue, or emotional stress caused by the problem.' },
  { label: 'Willingness to Change', desc: 'Evidence of previous attempts to switch tools or solve this problem.' },
];

const THINGS_TO_AVOID = [
  'Leading questions: "Would you use an AI tool that does this?"',
  'Premature pitching: Introducing your product before understanding their current workflow.',
  'Hypothetical questions: Asking what they "might" or "would" do in the future.',
  'Selling & convincing: Trying to persuade the customer that they have a problem.',
  'False validation: Mistaking polite compliments ("sounds cool!") for real willingness to buy.',
];

const STARTING_PRINCIPLES = [
  {
    num: '01',
    title: 'Ask for specific stories',
    text: 'Start with: "Walk me through the last time you had to deal with [process]..." rather than general opinions.',
  },
  {
    num: '02',
    title: 'Dig into the current workaround',
    text: 'Ask: "What tools are you using right now, and what breaks down when you use them?"',
  },
  {
    num: '03',
    title: 'Quantify the friction',
    text: 'Ask: "How much time or money does that cost you or your team when that happens?"',
  },
];

export const DiscoveryPrepPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentSetup } = useDiscoveryStore();

  const persona = currentSetup?.personaId ? getPersonaById(currentSetup.personaId) : null;
  const selectedAssumptions = (currentSetup?.assumptions ?? []).filter((a) => a.selected);
  const difficulty = currentSetup?.difficulty || 'moderate';

  const handleStart = () => {
    navigate(`/discovery/session/${id ?? currentSetup?.id ?? 'demo'}`);
  };

  return (
    <div className="prep-page">
      <div className="prep-page__inner">
        {/* Header */}
        <div className="prep-page__header">
          <div className="prep-page__badge-row">
            <Badge variant="discovery" size="sm">CUSTOMER DISCOVERY</Badge>
            <Badge variant={difficulty === 'hard' ? 'danger' : difficulty === 'moderate' ? 'warning' : 'success'} size="sm">
              {difficulty.toUpperCase()} MODE
            </Badge>
          </div>
          <h1 className="prep-page__title">Pre-Session Briefing</h1>
          <p className="prep-page__subtitle">
            You are about to rehearse with <strong>{persona?.name ?? 'your customer persona'}</strong>.
            Review what you need to learn, calibrate your instincts, and start when you are ready.
          </p>
        </div>

        <div className="prep-page__grid">
          {/* Section 1: What You Need To Learn */}
          <Card variant="elevated" className="prep-page__section">
            <div className="prep-page__section-header">
              <Target size={18} className="prep-icon--brand" />
              <h2>What you need to learn (Assumptions)</h2>
            </div>
            {selectedAssumptions.length > 0 ? (
              <ul className="prep-page__assumption-list">
                {selectedAssumptions.map((a) => (
                  <li key={a.id} className="prep-page__assumption-item">
                    <span className="prep-page__assumption-bullet" />
                    <div>
                      <strong>{a.statement}</strong>
                      <p className="prep-page__assumption-evidence">
                        <em>Evidence needed:</em> {a.evidenceNeeded}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="prep-page__empty-text">
                No specific assumptions selected. Focus broadly on uncovering the customer's daily workflow and operational pain.
              </p>
            )}
          </Card>

          {/* Section 2: Persona Persona Briefing */}
          {persona && (
            <Card variant="elevated" className="prep-page__section">
              <div className="prep-page__section-header">
                <div className="prep-page__persona-dot" />
                <h2>Your Practice Partner: {persona.name}</h2>
              </div>
              <div className="prep-page__persona-info">
                <p className="prep-page__persona-desc">{persona.description}</p>
                <div className="prep-page__persona-cues">
                  <span className="prep-page__cues-label">Expected Behavior:</span>
                  {persona.behaviorCues.slice(0, 4).map((cue, i) => (
                    <div key={i} className="prep-page__cue">
                      <span className="prep-page__cue-dot" />
                      <span>{cue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Section 3: What to Look For */}
          <Card variant="elevated" className="prep-page__section">
            <div className="prep-page__section-header">
              <Eye size={18} className="prep-icon--success" />
              <h2>What to look for (Signals)</h2>
            </div>
            <div className="prep-page__signals-list">
              {WHAT_TO_LOOK_FOR.map((item, idx) => (
                <div key={idx} className="prep-page__signal-item">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>{item.label}:</strong> {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 4: Things to Avoid */}
          <Card variant="elevated" className="prep-page__section prep-page__section--warn">
            <div className="prep-page__section-header">
              <ShieldAlert size={18} className="prep-icon--danger" />
              <h2>Mistakes to avoid</h2>
            </div>
            <ul className="prep-page__avoid-list">
              {THINGS_TO_AVOID.map((item, idx) => (
                <li key={idx} className="prep-page__avoid-item">
                  <XCircle size={15} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Starting Approach */}
        <Card variant="glass" className="prep-page__principles-card">
          <div className="prep-page__section-header">
            <Sparkles size={18} className="prep-icon--brand" />
            <h2>Recommended Starting Approach</h2>
          </div>
          <p className="prep-page__principles-desc">
            Don't follow a rigid script. Anchor on these three conversation instincts:
          </p>
          <div className="prep-page__principles-grid">
            {STARTING_PRINCIPLES.map((p) => (
              <div key={p.num} className="prep-principle-card">
                <span className="prep-principle-card__num">{p.num}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Start CTA */}
        <div className="prep-page__start">
          <Button
            variant="primary"
            size="lg"
            glow
            rightIcon={<ArrowRight size={18} />}
            onClick={handleStart}
          >
            Start Practice Session
          </Button>
          <p className="prep-page__start-note">
            The conversation is unscripted. Take your time, listen closely, and avoid pitching.
          </p>
        </div>
      </div>
    </div>
  );
};
