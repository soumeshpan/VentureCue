import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChevronRight, ChevronLeft, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePitchStore } from '../../store/pitchStore';
import { investorPersonas } from '../../data/personas';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { StepIndicator } from '../../components/shared/StepIndicator';
import { PersonaCard } from '../../components/shared/PersonaCard';
import '../discovery/DiscoverySetupPage.css';
import './PitchSetupPage.css';

const STEPS = [
  { label: 'Pitch Info' },
  { label: 'Investor' },
  { label: 'Difficulty' },
];

const DIFFICULTIES = [
  {
    value: 'easy' as const,
    label: 'Easy',
    desc: 'Collaborative, angel-style partner. Focuses on founder story and early customer validation.',
  },
  {
    value: 'moderate' as const,
    label: 'Moderate',
    desc: 'Professional skepticism. Probes unit economics, CAC/LTV, and competitive defensibility.',
  },
  {
    value: 'hard' as const,
    label: 'Hard',
    desc: 'High pressure VC. Interrupts, challenges growth calculations, and dismisses unbacked claims.',
  },
];

export const PitchSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSetup,
    wizardStep,
    isAnalyzing,
    setInfo,
    setDeckFile,
    analyzePitch,
    setPersona,
    setDifficulty,
    nextStep,
    prevStep,
    reset,
    finalizeSetup,
  } = usePitchStore();

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    reset();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const info = currentSetup?.info ?? {
    startupName: '',
    problem: '',
    solution: '',
    targetMarket: '',
    businessModel: '',
    traction: '',
    fundingRequired: '',
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!info.startupName?.trim()) {
      newErrors.startupName = 'Startup name is required.';
    }
    if (!info.problem?.trim()) {
      newErrors.problem = 'Describe the core problem your startup solves.';
    }
    if (!info.solution?.trim()) {
      newErrors.solution = 'Describe how your product solves this problem.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Next = () => {
    if (!validateStep1()) return;
    analyzePitch();
    nextStep();
  };

  const handleStart = () => {
    try {
      const setup = finalizeSetup();
      navigate(`/pitch/analysis/${setup.id}`);
    } catch {
      // Handled by disabled state
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-page__inner">
        {/* Header */}
        <div className="setup-page__top">
          <div>
            <div className="setup-page__eyebrow">PRACTICE MODULE</div>
            <h1 className="setup-page__title">Investor Pitch Q&amp;A Setup</h1>
            <p className="setup-page__subtitle">
              Configure your pitch narrative to calibrate AI investor personas for grueling partner-meeting Q&amp;A.
            </p>
          </div>
          <StepIndicator steps={STEPS} currentStep={wizardStep} />
        </div>

        {/* Step 1 — Pitch Info */}
        {wizardStep === 1 && (
          <div className="setup-page__step animate-fade-in-up">
            <div className="setup-page__step-heading">
              <h2>1. Tell us about your startup pitch</h2>
              <p>Enter your key pitch metrics and claims below to prepare the AI investor.</p>
            </div>

            {/* Optional Deck Upload Area */}
            <div className="pitch-upload-area" role="region" aria-label="Upload pitch deck">
              <FileText size={26} className="pitch-upload-area__icon" />
              <div className="pitch-upload-area__info">
                <p className="pitch-upload-area__title">Attach Pitch Deck (Optional Context)</p>
                <p className="pitch-upload-area__sub">PDF format · Attaches supplemental context for investor questioning</p>
              </div>
              <label className="btn btn--secondary btn--sm pitch-upload-area__btn">
                <Upload size={14} />
                <span>{currentSetup?.deckFileName ? 'Replace PDF' : 'Upload PDF'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setDeckFile(file.name);
                  }}
                />
              </label>
            </div>

            {currentSetup?.deckFileName && (
              <div className="pitch-upload-badge animate-fade-in">
                <CheckCircle2 size={15} />
                <span>Attached deck: <strong>{currentSetup.deckFileName}</strong></span>
              </div>
            )}

            {/* Form Fields */}
            <div className="setup-page__fields">
              <Input
                label="Startup name"
                required
                placeholder="e.g. InvoiceFlow"
                value={info.startupName ?? ''}
                error={errors.startupName}
                onChange={(e) => setInfo({ startupName: e.target.value })}
                autoFocus
              />

              <Textarea
                label="Problem"
                required
                placeholder="What specific pain point are you solving? Who feels it most?"
                value={info.problem ?? ''}
                error={errors.problem}
                onChange={(e) => setInfo({ problem: e.target.value })}
                rows={3}
              />

              <Textarea
                label="Solution"
                required
                placeholder="How does your product solve it? What is your technological advantage?"
                value={info.solution ?? ''}
                error={errors.solution}
                onChange={(e) => setInfo({ solution: e.target.value })}
                rows={3}
              />

              <Input
                label="Target market & sizing"
                placeholder="e.g. SMB finance teams in North America, estimated $8.5B TAM"
                value={info.targetMarket ?? ''}
                onChange={(e) => setInfo({ targetMarket: e.target.value })}
              />

              <Textarea
                label="Business model & pricing"
                placeholder="e.g. B2B SaaS, $99/seat/month with annual upfront billing"
                value={info.businessModel ?? ''}
                onChange={(e) => setInfo({ businessModel: e.target.value })}
                rows={2}
              />

              <Input
                label="Traction & key metrics"
                placeholder="e.g. $18k MRR (+20% MoM), 45 active businesses, 0% net churn"
                value={info.traction ?? ''}
                onChange={(e) => setInfo({ traction: e.target.value })}
              />

              <Input
                label="Funding required & use of funds"
                placeholder="e.g. Raising $1.5M Seed (60% engineering, 40% GTM distribution)"
                value={info.fundingRequired ?? ''}
                onChange={(e) => setInfo({ fundingRequired: e.target.value })}
              />
            </div>

            <div className="setup-page__actions">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                glow
                rightIcon={<ChevronRight size={16} />}
                onClick={handleStep1Next}
              >
                Continue to Investor
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Investor Persona */}
        {wizardStep === 2 && (
          <div className="setup-page__step animate-fade-in-up">
            <div className="setup-page__step-heading">
              <h2>2. Choose your Investor Persona</h2>
              <p>Select the investor personality archetype you want to practice defending against.</p>
            </div>

            <div className="setup-page__persona-grid">
              {investorPersonas.map((p) => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  selected={currentSetup?.personaId === p.id}
                  onSelect={setPersona}
                />
              ))}
            </div>

            <div className="setup-page__actions">
              <Button variant="ghost" leftIcon={<ChevronLeft size={16} />} onClick={prevStep}>
                Back
              </Button>
              <Button
                variant="primary"
                glow
                disabled={!currentSetup?.personaId}
                rightIcon={<ChevronRight size={16} />}
                onClick={nextStep}
              >
                Continue to Difficulty
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Difficulty */}
        {wizardStep === 3 && (
          <div className="setup-page__step animate-fade-in-up">
            <div className="setup-page__step-heading">
              <h2>3. Set Investor Pressure Level</h2>
              <p>Controls how aggressively the investor challenges claims, questions traction, and pushes for proof.</p>
            </div>

            <div className="setup-page__difficulty-list">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`difficulty-option ${
                    currentSetup?.difficulty === d.value ? 'difficulty-option--selected' : ''
                  }`}
                  onClick={() => setDifficulty(d.value)}
                  aria-pressed={currentSetup?.difficulty === d.value}
                >
                  <div className="difficulty-option__dot" />
                  <div className="difficulty-option__content">
                    <span className="difficulty-option__label">{d.label}</span>
                    <span className="difficulty-option__desc">{d.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="setup-page__actions">
              <Button variant="ghost" leftIcon={<ChevronLeft size={16} />} onClick={prevStep}>
                Back
              </Button>
              <Button
                variant="primary"
                glow
                size="lg"
                disabled={!currentSetup?.difficulty}
                loading={isAnalyzing}
                onClick={handleStart}
              >
                {isAnalyzing ? 'Analyzing pitch narrative…' : 'View Pitch Analysis'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
