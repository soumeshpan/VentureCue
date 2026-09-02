/**
 * VentureCue — Responsible AI, Safety & Trust Information Modal
 * Provides founders with full transparency on AI capabilities, simulation boundaries, and ethics.
 */

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  Info,
  X,
  FileCheck,
  Users,
} from 'lucide-react';
import { Button } from '../ui/Button';
import './ResponsibleAIModal.css';

interface ResponsibleAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsibleAIModal: React.FC<ResponsibleAIModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="rai-backdrop animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="rai-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rai-header">
          <div className="rai-header__title">
            <div className="rai-header__icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2>Responsible AI, Safety &amp; Transparency</h2>
              <p>How VentureCue designs for founder trust, ethical simulation, and data privacy.</p>
            </div>
          </div>
          <button className="rai-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="rai-body">
          {/* Core Trust Notice Banner */}
          <div className="rai-notice-banner">
            <Info size={18} className="rai-notice-icon" />
            <div>
              <strong>Simulation is Practice, Not Real-World Validation</strong>
              <p>
                A simulated customer response is not evidence of actual market demand. A simulated investor reaction does not predict actual funding interest. Always validate assumptions with real humans.
              </p>
            </div>
          </div>

          {/* Capabilities Grid: What AI Does vs What AI Does NOT Do */}
          <div className="rai-capabilities-grid">
            {/* What AI Does */}
            <div className="rai-cap-col rai-cap-col--does">
              <div className="rai-cap-header">
                <CheckCircle2 size={16} />
                <h3>What VentureCue AI Does</h3>
              </div>
              <ul>
                <li>Simulates realistic, challenging customer &amp; investor practice partners.</li>
                <li>Adapts responses to question quality, past-behavior probing, and metrics depth.</li>
                <li>Logs observable conversational evidence (quotes, leading questions, missed signals).</li>
                <li>Provides targeted coaching drills to sharpen human-to-human interview skills.</li>
                <li>Enables human coaches to verify, edit, or reject AI diagnoses in an immutable audit chain.</li>
              </ul>
            </div>

            {/* What AI Does NOT Do */}
            <div className="rai-cap-col rai-cap-col--does-not">
              <div className="rai-cap-header">
                <XCircle size={16} />
                <h3>What VentureCue AI Does NOT Do</h3>
              </div>
              <ul>
                <li>Does <strong>not</strong> validate real customer demand or market willingness to pay.</li>
                <li>Does <strong>not</strong> predict real-world VC investment decisions or term sheets.</li>
                <li>Does <strong>not</strong> judge or score founder personality, character, or inherent capability.</li>
                <li>Does <strong>not</strong> infer sensitive personal attributes (race, religion, health, gender).</li>
                <li>Does <strong>not</strong> invent unstated financial metrics, customers, or competitor data.</li>
              </ul>
            </div>
          </div>

          {/* Source of Truth Hierarchy */}
          <div className="rai-section">
            <h4>
              <FileCheck size={16} />
              <span>Source of Truth Hierarchy</span>
            </h4>
            <p className="rai-section-desc">
              To prevent hallucinations, our diagnostic engine evaluates findings in a strict priority order:
            </p>
            <div className="rai-hierarchy-steps">
              <div className="rai-step">
                <span className="rai-step__num">1</span>
                <div>
                  <strong>Explicit Founder Inputs</strong>
                  <span>Declared startup context, target customer profile, and pitch deck metrics.</span>
                </div>
              </div>
              <div className="rai-step">
                <span className="rai-step__num">2</span>
                <div>
                  <strong>Observed Transcript Evidence</strong>
                  <span>Exact verbatim quotes recorded during the live practice session.</span>
                </div>
              </div>
              <div className="rai-step">
                <span className="rai-step__num">3</span>
                <div>
                  <strong>Configured Persona Traits</strong>
                  <span>Behavioral archetypes (e.g. The Skeptic, The Metrics VC).</span>
                </div>
              </div>
              <div className="rai-step rai-step--inference">
                <span className="rai-step__num">4</span>
                <div>
                  <strong>AI Inferences (Clearly Labelled)</strong>
                  <span>Coaching interpretations explicitly separated from observable facts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Safeguards */}
          <div className="rai-section">
            <h4>
              <Lock size={16} />
              <span>Data Privacy &amp; Consent Safeguards</span>
            </h4>
            <ul className="rai-privacy-list">
              <li>
                <strong>Microphone Transparency:</strong> The microphone is only active while voice practice is toggled on. Visual status indicators reflect exact recording state.
              </li>
              <li>
                <strong>Full Data Deletion:</strong> Founders can delete any practice session and its associated debrief at any time with one click.
              </li>
              <li>
                <strong>Prompt Injection Protection:</strong> Personas are guarded against prompt extraction or manipulative instructions and remain safely in-character.
              </li>
              <li>
                <strong>Credential Safety:</strong> Zero API tokens or secrets are ever exposed in client bundles, transcripts, or audit logs.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="rai-footer">
          <Button variant="primary" size="md" onClick={onClose}>
            Understood &amp; Close
          </Button>
        </div>
      </div>
    </div>
  );
};
