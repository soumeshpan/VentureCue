import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Check,
  X,
} from 'lucide-react';
import { useDiscoveryStore } from '../../store/discoveryStore';
import { customerPersonas } from '../../data/personas';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { StepIndicator } from '../../components/shared/StepIndicator';
import { PersonaCard } from '../../components/shared/PersonaCard';
import { LoadingState } from '../../components/shared/States';
import type { Assumption, AssumptionCategory } from '../../types/discovery';
import './DiscoverySetupPage.css';

const STEPS = [
  { label: 'Startup' },
  { label: 'Assumptions' },
  { label: 'Persona' },
  { label: 'Difficulty' },
];

const DIFFICULTIES = [
  {
    value: 'easy' as const,
    label: 'Easy',
    desc: 'Cooperative customer. Answers questions directly and provides clear context. Ideal for your first practice session.',
  },
  {
    value: 'moderate' as const,
    label: 'Moderate',
    desc: 'Realistic resistance. Customer occasionally challenges assumptions, gives brief responses, or goes off on tangents.',
  },
  {
    value: 'hard' as const,
    label: 'Hard',
    desc: 'High friction. The persona interrupts, expresses skepticism, gives incomplete answers, or gives deceptive polite compliments.',
  },
];

export const DiscoverySetupPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSetup,
    wizardStep,
    isGeneratingAssumptions,
    updateContextField,
    handleFileUpload,
    generateAssumptions,
    toggleAssumption,
    updateAssumption,
    addCustomAssumption,
    deleteAssumption,
    setPersona,
    setDifficulty,
    nextStep,
    prevStep,
    finalizeSetup,
  } = useDiscoveryStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [editingAssumptionId, setEditingAssumptionId] = useState<string | null>(null);
  const [editStatement, setEditStatement] = useState('');
  const [editWhy, setEditWhy] = useState('');
  const [editEvidence, setEditEvidence] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newStatement, setNewStatement] = useState('');
  const [newCategory, setNewCategory] = useState<AssumptionCategory>('problem');
  const [newWhy, setNewWhy] = useState('');
  const [newEvidence, setNewEvidence] = useState('');

  const ctx = currentSetup?.context || {
    startupName: '',
    whatBuilding: '',
    targetCustomer: '',
    problemHypothesis: '',
    currentSolution: '',
    currentBeliefs: '',
  };

  const uploadState = ctx.documentUpload || { status: 'idle', progress: 0 };
  const assumptions = currentSetup?.assumptions || [];
  const selectedCount = assumptions.filter((a) => a.selected).length;

  // --- Step 1 Validation ---
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!ctx.startupName?.trim()) {
      errors.startupName = "Tell us what you're building first.";
    }
    if (!ctx.whatBuilding?.trim()) {
      errors.whatBuilding = 'Describe your product or core idea in 1–2 sentences.';
    }
    if (!ctx.targetCustomer?.trim()) {
      errors.targetCustomer = 'Specify who your target customer is.';
    }
    if (!ctx.problemHypothesis?.trim()) {
      errors.problemHypothesis = 'Tell us what specific problem you believe they have.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Next = () => {
    if (!validateStep1()) return;
    nextStep();
    if (assumptions.length === 0) {
      generateAssumptions();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // --- Assumption Editing ---
  const handleStartEdit = (a: Assumption) => {
    setEditingAssumptionId(a.id);
    setEditStatement(a.statement);
    setEditWhy(a.whyItMatters);
    setEditEvidence(a.evidenceNeeded);
  };

  const handleSaveEdit = (id: string) => {
    if (!editStatement.trim()) return;
    updateAssumption(id, {
      statement: editStatement.trim(),
      whyItMatters: editWhy.trim() || 'Core hypothesis to validate during discovery.',
      evidenceNeeded: editEvidence.trim() || 'Past customer behavior and workflows.',
    });
    setEditingAssumptionId(null);
  };

  const handleCreateCustom = () => {
    if (!newStatement.trim()) return;
    addCustomAssumption({
      statement: newStatement.trim(),
      category: newCategory,
      whyItMatters: newWhy.trim() || 'Custom hypothesis defined by the founder.',
      evidenceNeeded: newEvidence.trim() || 'Direct observations and customer examples.',
    });
    setNewStatement('');
    setNewWhy('');
    setNewEvidence('');
    setIsAddingCustom(false);
  };

  const handleStartPractice = () => {
    try {
      const setup = finalizeSetup();
      navigate(`/discovery/prep/${setup.id}`);
    } catch {
      // Incomplete setup guarded by button disabled state
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-page__inner">
        {/* Top Stepper */}
        <div className="setup-page__top">
          <div>
            <div className="setup-page__eyebrow">PRACTICE MODULE</div>
            <h1 className="setup-page__title">Customer Discovery Preparation</h1>
            <p className="setup-page__subtitle">
              Configure your practice context to calibrate the AI customer persona before your conversation.
            </p>
          </div>
          <StepIndicator steps={STEPS} currentStep={wizardStep} />
        </div>

        {/* STEP 1: STARTUP CONTEXT */}
        {wizardStep === 1 && (
          <div className="setup-page__step animate-fade-in-up">
            <div className="setup-page__step-heading">
              <h2>1. Tell us about your startup</h2>
              <p>
                This information allows the AI to extract your core assumptions and calibrate the customer's background.
              </p>
            </div>

            {/* Document Upload Area */}
            <div className="setup-upload-zone">
              <div className="setup-upload-zone__info">
                <FileText size={24} className="setup-upload-zone__icon" />
                <div>
                  <div className="setup-upload-zone__title">
                    Optional: Upload pitch deck or research notes
                  </div>
                  <div className="setup-upload-zone__sub">
                    PDF, PPTX, or TXT (Max 15MB) — extracts problem context automatically
                  </div>
                </div>
              </div>

              <div className="setup-upload-zone__action">
                <label className="btn btn--secondary btn--sm">
                  <Upload size={14} />
                  <span>{uploadState.status === 'completed' ? 'Replace File' : 'Choose File'}</span>
                  <input
                    type="file"
                    accept=".pdf,.pptx,.txt"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Upload Progress Bar / Status */}
            {uploadState.status === 'uploading' && (
              <div className="setup-upload-status animate-fade-in">
                <div className="setup-upload-status__text">
                  <span>Uploading {uploadState.fileName}...</span>
                  <span>{uploadState.progress}%</span>
                </div>
                <div className="setup-upload-bar">
                  <div className="setup-upload-bar__fill" style={{ width: `${uploadState.progress}%` }} />
                </div>
              </div>
            )}

            {uploadState.status === 'processing' && (
              <div className="setup-upload-status animate-fade-in">
                <div className="setup-upload-status__text">
                  <span>Analyzing document and extracting context...</span>
                  <span className="animate-spin">⏳</span>
                </div>
              </div>
            )}

            {uploadState.status === 'completed' && (
              <div className="setup-upload-badge animate-fade-in">
                <CheckCircle2 size={16} />
                <span>{uploadState.extractedSummary}</span>
              </div>
            )}

            {uploadState.status === 'failed' && (
              <div className="setup-upload-error animate-fade-in">
                <AlertCircle size={16} />
                <span>{uploadState.errorMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="setup-page__fields">
              <Input
                label="Startup name *"
                placeholder="e.g. InvoiceFlow"
                value={ctx.startupName}
                error={validationErrors.startupName}
                onChange={(e) => updateContextField('startupName', e.target.value)}
                autoFocus
              />

              <Textarea
                label="What are you building? *"
                placeholder="e.g. An AI-assisted invoicing tool for freelancers that automatically reconciles bank payments."
                value={ctx.whatBuilding}
                error={validationErrors.whatBuilding}
                onChange={(e) => updateContextField('whatBuilding', e.target.value)}
                rows={2}
              />

              <Input
                label="Who is your target customer? *"
                placeholder="e.g. Freelance designers and independent consultants"
                value={ctx.targetCustomer}
                error={validationErrors.targetCustomer}
                onChange={(e) => updateContextField('targetCustomer', e.target.value)}
              />

              <Textarea
                label="What problem do you believe they have? *"
                placeholder="e.g. They spend 5+ hours every month chasing unpaid invoices and lose track of billable hours."
                value={ctx.problemHypothesis}
                error={validationErrors.problemHypothesis}
                onChange={(e) => updateContextField('problemHypothesis', e.target.value)}
                rows={2}
              />

              <Input
                label="Current solution or alternative (How do they solve it today?)"
                placeholder="e.g. Google Sheets, manual email follow-ups, generic accounting tools"
                value={ctx.currentSolution || ''}
                onChange={(e) => updateContextField('currentSolution', e.target.value)}
              />

              <Textarea
                label="What do you currently assume about the customer? (optional)"
                placeholder="List any key assumptions about their habits, willingness to pay, or team size..."
                value={ctx.currentBeliefs || ''}
                onChange={(e) => updateContextField('currentBeliefs', e.target.value)}
                rows={2}
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
                Continue to Assumptions
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: DISCOVERY GOALS & ASSUMPTIONS */}
        {wizardStep === 2 && (
          <div className="setup-page__step animate-fade-in-up">
            <div className="setup-page__step-heading">
              <div className="setup-page__badge-row">
                <h2>2. Assumptions to Validate</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Sparkles size={14} />}
                  onClick={generateAssumptions}
                  disabled={isGeneratingAssumptions}
                >
                  Regenerate
                </Button>
              </div>
              <p>
                Select the hypotheses you want to test in this conversation. Practice focuses on gathering evidence, not pitching solutions.
              </p>
            </div>

            {/* Educational Guide: Leading Questions vs Good Discovery */}
            <div className="setup-educational-box">
              <div className="setup-educational-box__header">
                <HelpCircle size={16} />
                <span>Foundational Discovery Principle: Leading vs. Open Questions</span>
              </div>
              <div className="setup-educational-box__grid">
                <div className="setup-educational-box__item setup-educational-box__item--bad">
                  <strong>❌ LEADING QUESTION</strong>
                  <p>"Would you use an app that automatically creates invoices to save you time?"</p>
                  <span>Problem: Solicits polite agreement rather than real evidence.</span>
                </div>
                <div className="setup-educational-box__item setup-educational-box__item--good">
                  <strong>✅ GOOD DISCOVERY QUESTION</strong>
                  <p>"Tell me about the last time you had to create and follow up on an invoice."</p>
                  <span>Benefit: Uncovers factual past behavior, workflow steps, and real pain.</span>
                </div>
              </div>
            </div>

            {/* Assumptions List */}
            {isGeneratingAssumptions ? (
              <LoadingState message="Analyzing startup context and generating assumptions to test..." />
            ) : (
              <div className="setup-assumption-cards">
                {assumptions.map((a, idx) => (
                  <div
                    key={a.id}
                    className={`assumption-card ${a.selected ? 'assumption-card--selected' : ''}`}
                  >
                    {editingAssumptionId === a.id ? (
                      <div className="assumption-card__edit-form">
                        <Input
                          label="Assumption Statement"
                          value={editStatement}
                          onChange={(e) => setEditStatement(e.target.value)}
                          autoFocus
                        />
                        <Input
                          label="Why it matters"
                          value={editWhy}
                          onChange={(e) => setEditWhy(e.target.value)}
                        />
                        <Input
                          label="Evidence needed"
                          value={editEvidence}
                          onChange={(e) => setEditEvidence(e.target.value)}
                        />
                        <div className="assumption-card__edit-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<X size={14} />}
                            onClick={() => setEditingAssumptionId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Check size={14} />}
                            onClick={() => handleSaveEdit(a.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="assumption-card__top">
                          <button
                            type="button"
                            className="assumption-card__checkbox"
                            onClick={() => toggleAssumption(a.id)}
                            aria-label={`Toggle assumption ${idx + 1}`}
                          >
                            <div
                              className={`assumption-card__check-indicator ${
                                a.selected ? 'assumption-card__check-indicator--checked' : ''
                              }`}
                            >
                              {a.selected && <Check size={12} />}
                            </div>
                          </button>

                          <div className="assumption-card__content" onClick={() => toggleAssumption(a.id)}>
                            <div className="assumption-card__meta">
                              <span className={`assumption-card__tag assumption-card__tag--${a.category}`}>
                                {a.category}
                              </span>
                              <span className="assumption-card__num">ASSUMPTION {idx + 1}</span>
                            </div>
                            <h3 className="assumption-card__statement">{a.statement}</h3>
                            <div className="assumption-card__details">
                              <div className="assumption-card__detail">
                                <strong>Why this matters:</strong> {a.whyItMatters}
                              </div>
                              <div className="assumption-card__detail">
                                <strong>Evidence needed:</strong> {a.evidenceNeeded}
                              </div>
                            </div>
                          </div>

                          <div className="assumption-card__controls">
                            <button
                              type="button"
                              className="assumption-card__btn"
                              onClick={() => handleStartEdit(a)}
                              title="Edit assumption"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="assumption-card__btn assumption-card__btn--delete"
                              onClick={() => deleteAssumption(a.id)}
                              title="Delete assumption"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Add Custom Assumption */}
                {isAddingCustom ? (
                  <div className="assumption-card assumption-card--new animate-fade-in">
                    <h3>Add Custom Assumption</h3>
                    <Input
                      label="Hypothesis statement *"
                      placeholder="e.g. Customers prioritize mobile access over desktop integrations."
                      value={newStatement}
                      onChange={(e) => setNewStatement(e.target.value)}
                      autoFocus
                    />
                    <div className="assumption-card__category-select">
                      <label className="field__label">Category</label>
                      <div className="assumption-card__pills">
                        {(['problem', 'customer', 'behavior', 'market', 'solution'] as AssumptionCategory[]).map(
                          (cat) => (
                            <button
                              key={cat}
                              type="button"
                              className={`assumption-card__pill ${
                                newCategory === cat ? 'assumption-card__pill--active' : ''
                              }`}
                              onClick={() => setNewCategory(cat)}
                            >
                              {cat}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <Input
                      label="Why this matters"
                      placeholder="e.g. Determines our mobile vs web engineering focus."
                      value={newWhy}
                      onChange={(e) => setNewWhy(e.target.value)}
                    />
                    <Input
                      label="Evidence needed"
                      placeholder="e.g. When and where the customer currently uses their tool."
                      value={newEvidence}
                      onChange={(e) => setNewEvidence(e.target.value)}
                    />
                    <div className="assumption-card__edit-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<X size={14} />}
                        onClick={() => setIsAddingCustom(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus size={14} />}
                        onClick={handleCreateCustom}
                        disabled={!newStatement.trim()}
                      >
                        Add Assumption
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="assumption-add-btn"
                    onClick={() => setIsAddingCustom(true)}
                  >
                    <Plus size={16} />
                    <span>Add Custom Assumption</span>
                  </button>
                )}
              </div>
            )}

            {selectedCount === 0 && !isGeneratingAssumptions && (
              <div className="setup-warning-banner animate-fade-in">
                <AlertCircle size={16} />
                <span>Please select at least one assumption to explore before continuing.</span>
              </div>
            )}

            <div className="setup-page__actions">
              <Button variant="ghost" leftIcon={<ChevronLeft size={16} />} onClick={prevStep}>
                Back
              </Button>
              <Button
                variant="primary"
                glow
                rightIcon={<ChevronRight size={16} />}
                onClick={nextStep}
                disabled={selectedCount === 0 || isGeneratingAssumptions}
              >
                Continue to Persona ({selectedCount} Selected)
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CUSTOMER PERSONAS */}
        {wizardStep === 3 && (
          <div className="setup-page__step animate-fade-in-up">
            <div className="setup-page__step-heading">
              <h2>3. Choose your Customer Persona</h2>
              <p>
                Select the customer archetype you want to practice with. Each persona represents a distinct conversation challenge.
              </p>
            </div>

            <div className="setup-page__persona-grid">
              {customerPersonas.map((p) => (
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

        {/* STEP 4: DIFFICULTY SELECTION */}
        {wizardStep === 4 && (
          <div className="setup-page__step animate-fade-in-up">
            <div className="setup-page__step-heading">
              <h2>4. Set Conversation Difficulty</h2>
              <p>
                Difficulty controls the persona's conversational friction, interruptions, and resistance.
              </p>
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
                onClick={handleStartPractice}
              >
                Proceed to Briefing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
