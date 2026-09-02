import React from 'react';
import type { Persona } from '../../types/persona';
import { Badge } from '../ui/Badge';
import './PersonaCard.css';

// Simple icon map using emoji fallbacks for build simplicity
// In Phase 2 these will use proper Lucide icons
const difficultyLabel: Record<string, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
};

const difficultyVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  easy: 'success',
  moderate: 'warning',
  hard: 'danger',
};

interface PersonaCardProps {
  persona: Persona;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  selected = false,
  onSelect,
}) => (
  <button
    className={`persona-card ${selected ? 'persona-card--selected' : ''}`}
    onClick={() => onSelect?.(persona.id)}
    aria-pressed={selected}
    aria-label={`Select ${persona.name} persona`}
  >
    <div className="persona-card__header">
      <div className="persona-card__selected-ring" aria-hidden="true" />
      <div className="persona-card__badges">
        <Badge variant={difficultyVariant[persona.difficulty]} size="sm">
          {difficultyLabel[persona.difficulty]}
        </Badge>
      </div>
    </div>

    <h3 className="persona-card__name">{persona.name}</h3>
    <p className="persona-card__tagline">{persona.tagline}</p>
    <p className="persona-card__description">{persona.description}</p>

    <ul className="persona-card__cues">
      {persona.behaviorCues.slice(0, 3).map((cue, i) => (
        <li key={i} className="persona-card__cue">
          <span className="persona-card__cue-dot" aria-hidden="true" />
          {cue}
        </li>
      ))}
    </ul>
  </button>
);
