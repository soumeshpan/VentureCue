import React from 'react';
import { Check } from 'lucide-react';
import './StepIndicator.css';

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 1-indexed
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => (
  <div className="step-indicator" role="list" aria-label="Progress">
    {steps.map((step, i) => {
      const stepNum = i + 1;
      const isCompleted = stepNum < currentStep;
      const isActive = stepNum === currentStep;

      return (
        <React.Fragment key={stepNum}>
          <div
            className={`step-indicator__item ${
              isCompleted ? 'step-indicator__item--completed' : ''
            } ${isActive ? 'step-indicator__item--active' : ''} ${
              !isCompleted && !isActive ? 'step-indicator__item--future' : ''
            }`}
            role="listitem"
            aria-current={isActive ? 'step' : undefined}
          >
            <div className="step-indicator__bubble">
              {isCompleted ? (
                <Check size={14} strokeWidth={2.5} />
              ) : (
                <span>{stepNum}</span>
              )}
            </div>
            <div className="step-indicator__text">
              <span className="step-indicator__label">{step.label}</span>
              {step.description && (
                <span className="step-indicator__desc">{step.description}</span>
              )}
            </div>
          </div>

          {i < steps.length - 1 && (
            <div
              className={`step-indicator__connector ${
                isCompleted ? 'step-indicator__connector--completed' : ''
              }`}
              aria-hidden="true"
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);
