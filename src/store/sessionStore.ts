import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, AvatarState, TranscriptLine } from '../types/session';

interface SessionState {
  sessions: Session[];
  activeSession: Session | null;
  avatarState: AvatarState;

  // Session management
  startSession: (session: Session) => void;
  endSession: () => void;
  updateActiveSession: (updates: Partial<Session>) => void;
  saveCompletedSession: (session: Session) => void;
  deleteSession: (sessionId: string) => void;

  // Live session state
  setAvatarState: (state: AvatarState) => void;
  addTranscriptLine: (line: TranscriptLine) => void;

  // History
  getSessionById: (id: string) => Session | undefined;
  getSessionsByType: (type: 'discovery' | 'pitch') => Session[];
  clearAllSessions: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,
      avatarState: 'idle',

      clearAllSessions: () => {
        set({ sessions: [], activeSession: null });
      },

      startSession: (session) => {
        set({ activeSession: session, avatarState: 'idle' });
      },

      endSession: () => {
        const { activeSession } = get();
        if (activeSession) {
          const completed = {
            ...activeSession,
            endedAt: Date.now(),
            durationSeconds: Math.floor((Date.now() - activeSession.startedAt) / 1000),
          };
          set((state) => ({
            sessions: [completed, ...state.sessions.filter((s) => s.id !== completed.id)],
            activeSession: null,
            avatarState: 'idle',
          }));
        }
      },

      updateActiveSession: (updates) => {
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, ...updates }
            : null,
        }));
      },

      saveCompletedSession: (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
        }));
      },

      setAvatarState: (avatarState) => set({ avatarState }),

      addTranscriptLine: (line) => {
        set((state) => ({
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                transcript: [...state.activeSession.transcript, line],
              }
            : null,
        }));
      },

      getSessionById: (id) => get().sessions.find((s) => s.id === id),

      getSessionsByType: (type) => get().sessions.filter((s) => s.type === type),
    }),
    {
      name: 'venturecue-sessions',
      version: 2,
      migrate: (persistedState: any) => {
        if (persistedState && Array.isArray(persistedState.sessions)) {
          return {
            ...persistedState,
            sessions: persistedState.sessions.filter(
              (s: any) => s.id && !s.id.startsWith('sess-') && !s.id.startsWith('mock-')
            ),
          };
        }
        return persistedState;
      },
    }
  )
);
