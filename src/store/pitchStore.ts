import { create } from 'zustand';
import type { PitchSetup, PitchInfo, PitchAnalysis, PitchWizardStep } from '../types/pitch';
import type { Difficulty } from '../types/session';

const generateMockAnalysis = (info: Partial<PitchInfo>): PitchAnalysis => ({
  strengths: [
    {
      id: 's1',
      area: 'Problem clarity',
      description: info.problem
        ? 'Your problem statement is specific and grounded.'
        : 'You have identified a problem area — make it more specific.',
    },
  ],
  concerns: [
    {
      id: 'c1',
      area: 'Market size validation',
      description: 'Your market size claim may need to be bottom-up, not just top-down.',
      severity: 'medium',
    },
    {
      id: 'c2',
      area: 'Traction evidence',
      description: !info.traction
        ? 'You have not provided traction data. Investors will probe this heavily.'
        : 'Ensure your traction metrics are precisely defined.',
      severity: !info.traction ? 'high' : 'low',
    },
    {
      id: 'c3',
      area: 'Competitive moat',
      description: 'Your differentiation needs to explain why you win long-term, not just today.',
      severity: 'medium',
    },
  ],
  missingInfo: [
    !info.financials ? 'Financial projections or unit economics' : '',
    !info.useOfFunds ? 'Use of funds breakdown' : '',
    !info.businessModel ? 'Revenue model detail' : '',
  ].filter(Boolean) as string[],
  claimsNeedingEvidence: [
    info.targetMarket?.includes('billion') ? 'Market size — needs source or bottom-up calculation' : '',
    info.traction ? 'Traction metrics — be prepared to define terms precisely' : '',
  ].filter(Boolean) as string[],
  likelyQuestionAreas: [
    'Why will you win vs. existing alternatives?',
    'What are your key unit economics?',
    'How do you acquire customers and at what cost?',
    'What does the competitive landscape look like in 3 years?',
  ],
});

interface PitchState {
  currentSetup: Partial<PitchSetup> | null;
  wizardStep: PitchWizardStep;
  isAnalyzing: boolean;

  setInfo: (info: Partial<PitchInfo>) => void;
  setDeckFile: (fileName: string) => void;
  analyzePitch: () => void;
  setPersona: (personaId: string) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  goToStep: (step: PitchWizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  finalizeSetup: () => PitchSetup;
}

export const usePitchStore = create<PitchState>()((set, get) => ({
  currentSetup: null,
  wizardStep: 1,
  isAnalyzing: false,

  setInfo: (info) => {
    set((state) => ({
      currentSetup: {
        ...state.currentSetup,
        id: state.currentSetup?.id ?? `pitch-${Date.now()}`,
        info: { ...state.currentSetup?.info, ...info },
        createdAt: state.currentSetup?.createdAt ?? Date.now(),
      },
    }));
  },

  setDeckFile: (fileName) => {
    set((state) => ({
      currentSetup: { ...state.currentSetup, deckFileName: fileName },
    }));
  },

  analyzePitch: () => {
    const { currentSetup } = get();
    if (!currentSetup?.info) return;

    set({ isAnalyzing: true });

    setTimeout(() => {
      const analysis = generateMockAnalysis(currentSetup.info!);
      set((state) => ({
        currentSetup: { ...state.currentSetup, analysis },
        isAnalyzing: false,
      }));
    }, 2000);
  },

  setPersona: (personaId) => {
    set((state) => ({
      currentSetup: { ...state.currentSetup, personaId },
    }));
  },

  setDifficulty: (difficulty) => {
    set((state) => ({
      currentSetup: { ...state.currentSetup, difficulty },
    }));
  },

  goToStep: (step) => set({ wizardStep: step }),

  nextStep: () => {
    const { wizardStep } = get();
    if (wizardStep < 3) set({ wizardStep: (wizardStep + 1) as PitchWizardStep });
  },

  prevStep: () => {
    const { wizardStep } = get();
    if (wizardStep > 1) set({ wizardStep: (wizardStep - 1) as PitchWizardStep });
  },

  reset: () => set({ currentSetup: null, wizardStep: 1, isAnalyzing: false }),

  finalizeSetup: () => {
    const { currentSetup } = get();
    if (!currentSetup || !currentSetup.personaId || !currentSetup.difficulty) {
      throw new Error('Setup is incomplete');
    }
    return currentSetup as PitchSetup;
  },
}));
