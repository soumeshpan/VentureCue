export type PersonaCategory = 'customer' | 'investor';

export interface PersonaTrait {
  label: string;
  description: string;
}

export interface Persona {
  id: string;
  category: PersonaCategory;
  name: string;
  tagline: string;
  description: string;
  behaviorCues: string[];
  traits: PersonaTrait[];
  difficulty: 'easy' | 'moderate' | 'hard';
  icon: string; // lucide icon name
}
