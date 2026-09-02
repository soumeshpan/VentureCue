import React from 'react';
import { Button } from '../ui/Button';
import './States.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="state-container">
    {icon && <div className="state-icon">{icon}</div>}
    <h3 className="state-title">{title}</h3>
    {description && <p className="state-description">{description}</p>}
    {action && (
      <Button variant="primary" onClick={action.onClick} className="state-action">
        {action.label}
      </Button>
    )}
  </div>
);

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'We ran into an unexpected issue. Please try again.',
  onRetry,
}) => (
  <div className="state-container">
    <div className="state-icon state-icon--error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <h3 className="state-title">{title}</h3>
    <p className="state-description">{description}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry} className="state-action">
        Try again
      </Button>
    )}
  </div>
);

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => (
  <div className="state-container">
    <div className="state-spinner animate-spin" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="var(--border-strong)" strokeWidth="3" />
        <path
          d="M 12 2 A 10 10 0 0 1 22 12"
          stroke="var(--brand-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <p className="state-message">{message}</p>
  </div>
);
