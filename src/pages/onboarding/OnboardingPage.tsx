import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Rocket } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { UserProfile } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import './OnboardingPage.css';

const STAGES: { value: UserProfile['stage']; label: string; desc: string }[] = [
  { value: 'idea', label: 'Just an idea', desc: 'I have a problem or concept I\'m exploring' },
  { value: 'mvp', label: 'Early MVP', desc: 'I have something built but not yet validated' },
  { value: 'traction', label: 'Early traction', desc: 'I have some customers or user feedback' },
  { value: 'scaling', label: 'Scaling', desc: 'I\'m growing and preparing for investment' },
];

const GOALS: { value: UserProfile['primaryGoal']; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'discovery', label: 'Customer Discovery', icon: <Users size={22} />, desc: 'I want to prepare better customer conversations' },
  { value: 'pitch', label: 'Investor Pitch', icon: <TrendingUp size={22} />, desc: 'I want to practice my investor Q&A' },
  { value: 'both', label: 'Both', icon: <Rocket size={22} />, desc: 'I want to prepare for both' },
];

export const OnboardingPage: React.FC = () => {
  const { completeOnboarding, user } = useAuthStore();
  const navigate = useNavigate();
  const [stage, setStage] = useState<UserProfile['stage']>('idea');
  const [goal, setGoal] = useState<UserProfile['primaryGoal']>('both');
  const [startupName, setStartupName] = useState('');
  const [step, setStep] = useState(1);

  const handleFinish = () => {
    completeOnboarding({ startupName: startupName || 'My Startup', stage, primaryGoal: goal });
    navigate('/dashboard');
  };

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <div className="onboarding__progress">
          <div className="onboarding__progress-bar" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="onboarding__step animate-fade-in-up">
            <h1>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1>
            <p>Let's set up your practice environment. It takes about 30 seconds.</p>
            <div className="onboarding__question">
              <label className="onboarding__label">What stage is your startup at?</label>
              <div className="onboarding__option-grid">
                {STAGES.map(s => (
                  <button
                    key={s.value}
                    className={`onboarding__option ${stage === s.value ? 'onboarding__option--selected' : ''}`}
                    onClick={() => setStage(s.value)}
                    aria-pressed={stage === s.value}
                  >
                    <span className="onboarding__option-label">{s.label}</span>
                    <span className="onboarding__option-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button variant="primary" size="lg" fullWidth glow onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding__step animate-fade-in-up">
            <h1>What do you want to prepare for?</h1>
            <p>You can always use both features later — this just helps us show you the right starting point.</p>
            <div className="onboarding__goal-grid">
              {GOALS.map(g => (
                <button
                  key={g.value}
                  className={`onboarding__goal ${goal === g.value ? 'onboarding__goal--selected' : ''}`}
                  onClick={() => setGoal(g.value)}
                  aria-pressed={goal === g.value}
                >
                  <div className="onboarding__goal-icon">{g.icon}</div>
                  <span className="onboarding__goal-label">{g.label}</span>
                  <span className="onboarding__goal-desc">{g.desc}</span>
                </button>
              ))}
            </div>
            <div className="onboarding__actions">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" size="lg" glow onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding__step animate-fade-in-up">
            <h1>One last thing.</h1>
            <p>What is your startup called? (You can change this later.)</p>
            <div className="onboarding__question">
              <label className="onboarding__label" htmlFor="startup-name">Startup name</label>
              <input
                id="startup-name"
                className="onboarding__text-input"
                type="text"
                placeholder="e.g. InvoiceFlow, Beacon, Lattice…"
                value={startupName}
                onChange={e => setStartupName(e.target.value)}
                autoFocus
                maxLength={60}
              />
            </div>
            <div className="onboarding__actions">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" size="lg" glow onClick={handleFinish}>
                Go to dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
