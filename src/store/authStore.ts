import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  startupName?: string;
  stage?: 'idea' | 'mvp' | 'traction' | 'scaling';
  primaryGoal?: 'discovery' | 'pitch' | 'both';
  onboardingComplete: boolean;
  createdAt: number;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, name: string) => void;
  signup: (email: string, name: string) => void;
  logout: () => void;
  completeOnboarding: (data: {
    startupName: string;
    stage: UserProfile['stage'];
    primaryGoal: UserProfile['primaryGoal'];
  }) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (email: string, name: string) => {
        set({
          isAuthenticated: true,
          user: {
            id: `user-${Date.now()}`,
            name,
            email,
            onboardingComplete: false,
            createdAt: Date.now(),
          },
        });
      },

      signup: (email: string, name: string) => {
        set({
          isAuthenticated: true,
          user: {
            id: `user-${Date.now()}`,
            name,
            email,
            onboardingComplete: false,
            createdAt: Date.now(),
          },
        });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
      },

      completeOnboarding: (data) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, ...data, onboardingComplete: true }
            : null,
        }));
      },

      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: 'venturecue-auth',
    }
  )
);
