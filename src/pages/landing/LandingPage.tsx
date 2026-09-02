import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, TrendingUp, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import './LandingPage.css';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Prepare',
    description: 'Define your startup context, problem hypotheses, and the key assumptions you need to test.',
  },
  {
    step: '02',
    title: 'Practice',
    description: 'Engage in realistic, unscripted voice or text dialogue with calibrated customer and investor AI personas.',
  },
  {
    step: '03',
    title: 'Improve',
    description: 'Review in-depth analytics highlighting your strongest moments, leading questions, and objection handling.',
  },
  {
    step: '04',
    title: 'Have the real conversation',
    description: 'Step into real customer interviews and investor partner meetings with calibrated instincts and confidence.',
  },
];

const VALUE_PROPS = [
  'Identify biased and leading questions before real customers hear them',
  'Master investor objection handling before walking into the partner meeting',
  'Build founder intuition through repeatable, safe scenario simulation',
  'Validate critical business hypotheses without burning precious prospect leads',
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing__header">
        <div className="landing__header-brand">
          <div className="landing__logo">
            <Zap size={16} />
          </div>
          <span className="landing__brand-name">VentureCue</span>
        </div>
        <div className="landing__header-actions">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing__hero">
        <div className="landing__hero-eyebrow">
          <Sparkles size={13} />
          <span>AI CONVERSATION PREPARATION FOR FOUNDERS</span>
        </div>

        <h1 className="landing__hero-headline">
          Prepare for the conversations<br />
          <span className="landing__hero-accent">that matter.</span>
        </h1>

        <p className="landing__hero-sub">
          Rehearse customer discovery and investor conversations with realistic AI personas before the real conversation begins.
        </p>

        <div className="landing__hero-actions">
          <Button
            variant="primary"
            size="lg"
            glow
            rightIcon={<ArrowRight size={18} />}
            onClick={() => navigate('/signup')}
          >
            Start Preparing
          </Button>
          <Button variant="secondary" size="lg" onClick={scrollToHow}>
            See How It Works
          </Button>
        </div>

        {/* Hero Visual Mockup */}
        <div className="landing__mockup-container">
          <div className="landing__mockup-glow" />
          <div className="landing__mockup-window">
            <div className="landing__mockup-header">
              <div className="landing__mockup-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="landing__mockup-title">venturecue.app — live session</div>
              <div className="landing__mockup-status">
                <span className="landing__mockup-badge">LIVE SIMULATION</span>
              </div>
            </div>
            <img
              src="/hero-preview.jpg"
              alt="VentureCue Realtime AI Practice Partner Interface"
              className="landing__mockup-img"
            />
          </div>
        </div>
      </section>

      {/* Product Features Section */}
      <section className="landing__modules" id="features">
        <div className="landing__section-header">
          <div className="landing__section-label">Practice Modules</div>
          <h2 className="landing__section-title">Engineered for high-stakes founder moments</h2>
          <p className="landing__section-desc">
            VentureCue is a practice partner, not a replacement for talking to real people. Build muscle memory before it counts.
          </p>
        </div>

        <div className="landing__module-grid">
          {/* Module 1: Customer Discovery */}
          <div className="landing__module landing__module--discovery">
            <div className="landing__module-icon">
              <Users size={26} />
            </div>
            <h3>CUSTOMER DISCOVERY</h3>
            <p className="landing__module-tagline">
              Practice before you talk to real customers.
            </p>
            <p className="landing__module-text">
              Rehearse exploratory conversations with diverse customer personas—from skeptical skeptics to busy executives. Identify leading questions and unvalidated assumptions before speaking with real prospects.
            </p>
            <ul className="landing__module-bullets">
              <li>Automatic extraction of unvalidated assumptions</li>
              <li>Realistic customer resistance and persona archetypes</li>
              <li>Scoring on question neutrality, depth, and listening ratio</li>
            </ul>
            <div className="landing__module-cta">
              <Button variant="secondary" size="sm" onClick={() => navigate('/signup')}>
                Explore Discovery Mode
              </Button>
            </div>
          </div>

          {/* Module 2: Investor Pitch */}
          <div className="landing__module landing__module--pitch">
            <div className="landing__module-icon">
              <TrendingUp size={26} />
            </div>
            <h3>INVESTOR PITCH</h3>
            <p className="landing__module-tagline">
              Pressure-test your pitch before the room does.
            </p>
            <p className="landing__module-text">
              Upload your pitch deck and practice dynamic, grueling investor Q&amp;A sessions. Face AI investor personas calibrated to probe your unit economics, go-to-market defensibility, and market sizing.
            </p>
            <ul className="landing__module-bullets">
              <li>Comprehensive deck and claim analysis</li>
              <li>Adaptive investor questioning calibrated to your answers</li>
              <li>Clear identification of weak points, red flags, and gaps</li>
            </ul>
            <div className="landing__module-cta">
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                Explore Pitch Mode
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing__how" id="how-it-works">
        <div className="landing__section-header">
          <div className="landing__section-label">Workflow</div>
          <h2 className="landing__section-title">How VentureCue fits your process</h2>
          <p className="landing__section-desc">
            A disciplined feedback loop to turn conversation preparation into measurable execution.
          </p>
        </div>

        <div className="landing__steps-grid">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="landing__step-card">
              <div className="landing__step-num">{item.step}</div>
              <h3 className="landing__step-title">{item.title}</h3>
              <p className="landing__step-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Section */}
      <section className="landing__why">
        <div className="landing__why-card">
          <div className="landing__section-label">Why Founders Use VentureCue</div>
          <h2 className="landing__section-title">Never burn a critical meeting unprepared</h2>
          <ul className="landing__value-list">
            {VALUE_PROPS.map((v, i) => (
              <li key={i} className="landing__value-item">
                <CheckCircle2 size={18} />
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing__cta">
        <div className="landing__cta-glow" />
        <div className="landing__cta-content">
          <ShieldCheck size={36} className="landing__cta-icon" />
          <h2>Ready to rehearse your most critical conversation?</h2>
          <p>Practice in a safe, intelligent environment. Build confidence through iteration.</p>
          <Button
            variant="primary"
            size="lg"
            glow
            rightIcon={<ArrowRight size={18} />}
            onClick={() => navigate('/signup')}
          >
            Start Preparing Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-brand">
          <div className="landing__logo">
            <Zap size={14} />
          </div>
          <span>VentureCue</span>
        </div>
        <p className="landing__footer-tagline">Prepare for the conversations that matter.</p>
      </footer>
    </div>
  );
};
