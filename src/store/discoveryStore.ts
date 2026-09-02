import { create } from 'zustand';
import type { DiscoveryContext, DiscoverySetup, Assumption, DiscoveryWizardStep, DocumentUploadState } from '../types/discovery';
import type { Difficulty } from '../types/session';
import { AssumptionService } from '../services/ai/AssumptionService';

interface DiscoveryState {
  currentSetup: Partial<DiscoverySetup> | null;
  wizardStep: DiscoveryWizardStep;
  isGeneratingAssumptions: boolean;

  // Setup Actions
  setContext: (context: DiscoveryContext) => void;
  updateContextField: <K extends keyof DiscoveryContext>(field: K, value: DiscoveryContext[K]) => void;
  setDocumentUploadState: (state: Partial<DocumentUploadState>) => void;
  handleFileUpload: (file: File) => Promise<void>;

  // Assumption Actions
  setAssumptions: (assumptions: Assumption[]) => void;
  toggleAssumption: (id: string) => void;
  updateAssumption: (id: string, updates: Partial<Assumption>) => void;
  addCustomAssumption: (params: { statement: string; category?: Assumption['category']; whyItMatters?: string; evidenceNeeded?: string }) => void;
  deleteAssumption: (id: string) => void;
  generateAssumptions: () => void;

  // Persona & Difficulty Actions
  setPersona: (personaId: string) => void;
  setDifficulty: (difficulty: Difficulty) => void;

  // Navigation Actions
  goToStep: (step: DiscoveryWizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  finalizeSetup: () => DiscoverySetup;
}

export const useDiscoveryStore = create<DiscoveryState>()((set, get) => ({
  currentSetup: {
    id: `disc-${Date.now()}`,
    context: {
      startupName: '',
      whatBuilding: '',
      targetCustomer: '',
      problemHypothesis: '',
      currentSolution: '',
      currentBeliefs: '',
      documentUpload: {
        status: 'idle',
        progress: 0,
      },
    },
    assumptions: [],
    personaId: 'skeptic',
    difficulty: 'moderate',
    createdAt: Date.now(),
  },
  wizardStep: 1,
  isGeneratingAssumptions: false,

  setContext: (context) => {
    set((state) => ({
      currentSetup: {
        ...state.currentSetup,
        id: state.currentSetup?.id ?? `disc-${Date.now()}`,
        context,
        createdAt: state.currentSetup?.createdAt ?? Date.now(),
      },
    }));
  },

  updateContextField: (field, value) => {
    set((state) => {
      const currentContext = state.currentSetup?.context || {
        startupName: '',
        whatBuilding: '',
        targetCustomer: '',
        problemHypothesis: '',
      };
      return {
        currentSetup: {
          ...state.currentSetup,
          context: {
            ...currentContext,
            [field]: value,
          },
        },
      };
    });
  },

  setDocumentUploadState: (uploadState) => {
    set((state) => {
      const currentContext = state.currentSetup?.context || {
        startupName: '',
        whatBuilding: '',
        targetCustomer: '',
        problemHypothesis: '',
      };
      return {
        currentSetup: {
          ...state.currentSetup,
          context: {
            ...currentContext,
            documentUpload: {
              ...(currentContext.documentUpload || { status: 'idle', progress: 0 }),
              ...uploadState,
            },
          },
        },
      };
    });
  },

  handleFileUpload: async (file: File) => {
    const { setDocumentUploadState, updateContextField } = get();

    setDocumentUploadState({
      status: 'uploading',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || file.name.split('.').pop()?.toUpperCase(),
      progress: 25,
      errorMessage: undefined,
    });

    // Simulate upload progress
    await new Promise((r) => setTimeout(r, 400));
    setDocumentUploadState({ progress: 65, status: 'processing' });

    try {
      // Read file content if text
      let textContent = '';
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        textContent = await file.text();
      } else {
        textContent = `[Parsed from ${file.name}]: Operational workflow, key customer segments, and problem statement documentation.`;
      }

      await new Promise((r) => setTimeout(r, 600));

      setDocumentUploadState({
        status: 'completed',
        progress: 100,
        extractedSummary: `Extracted relevant context from ${file.name} (${Math.round(file.size / 1024)} KB).`,
      });

      updateContextField('documentName', file.name);
      updateContextField('documentContent', textContent);
    } catch {
      setDocumentUploadState({
        status: 'failed',
        progress: 0,
        errorMessage: 'Failed to parse file. You can still proceed by entering details manually.',
      });
    }
  },

  setAssumptions: (assumptions) => {
    set((state) => ({
      currentSetup: { ...state.currentSetup, assumptions },
    }));
  },

  toggleAssumption: (id) => {
    set((state) => ({
      currentSetup: {
        ...state.currentSetup,
        assumptions: (state.currentSetup?.assumptions ?? []).map((a) =>
          a.id === id ? { ...a, selected: !a.selected } : a
        ),
      },
    }));
  },

  updateAssumption: (id, updates) => {
    set((state) => ({
      currentSetup: {
        ...state.currentSetup,
        assumptions: (state.currentSetup?.assumptions ?? []).map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      },
    }));
  },

  addCustomAssumption: ({ statement, category = 'problem', whyItMatters = 'Custom founder hypothesis to test.', evidenceNeeded = 'Direct customer quotes of past behavior.' }) => {
    const newAssumption: Assumption = {
      id: `custom-asmp-${Date.now()}`,
      statement: statement.trim(),
      category,
      whyItMatters,
      evidenceNeeded,
      validationStatus: 'unvalidated',
      selected: true,
    };
    set((state) => ({
      currentSetup: {
        ...state.currentSetup,
        assumptions: [newAssumption, ...(state.currentSetup?.assumptions ?? [])],
      },
    }));
  },

  deleteAssumption: (id) => {
    set((state) => ({
      currentSetup: {
        ...state.currentSetup,
        assumptions: (state.currentSetup?.assumptions ?? []).filter((a) => a.id !== id),
      },
    }));
  },

  generateAssumptions: () => {
    const { currentSetup } = get();
    if (!currentSetup?.context) return;

    set({ isGeneratingAssumptions: true });

    setTimeout(() => {
      const generated = AssumptionService.generateAssumptions(currentSetup.context!);
      set((state) => ({
        currentSetup: { ...state.currentSetup, assumptions: generated },
        isGeneratingAssumptions: false,
      }));
    }, 700);
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
    if (wizardStep < 4) set({ wizardStep: (wizardStep + 1) as DiscoveryWizardStep });
  },

  prevStep: () => {
    const { wizardStep } = get();
    if (wizardStep > 1) set({ wizardStep: (wizardStep - 1) as DiscoveryWizardStep });
  },

  reset: () =>
    set({
      currentSetup: {
        id: `disc-${Date.now()}`,
        context: {
          startupName: '',
          whatBuilding: '',
          targetCustomer: '',
          problemHypothesis: '',
          currentSolution: '',
          currentBeliefs: '',
          documentUpload: {
            status: 'idle',
            progress: 0,
          },
        },
        assumptions: [],
        personaId: 'skeptic',
        difficulty: 'moderate',
        createdAt: Date.now(),
      },
      wizardStep: 1,
      isGeneratingAssumptions: false,
    }),

  finalizeSetup: () => {
    const { currentSetup } = get();
    if (!currentSetup || !currentSetup.context || !currentSetup.personaId || !currentSetup.difficulty) {
      throw new Error('Setup is incomplete');
    }
    return currentSetup as DiscoverySetup;
  },
}));
