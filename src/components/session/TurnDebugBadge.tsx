import React, { useState, useEffect } from 'react';
import { NvidiaNimService, type TurnTelemetry } from '../../services/ai/NvidiaNimService';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import './TurnDebugBadge.css';

export const TurnDebugBadge: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TurnTelemetry | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const latest = NvidiaNimService.getLatestTelemetry();
      setTelemetry(latest);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!telemetry) {
    return (
      <div className="turn-debug-badge turn-debug-badge--ready">
        <span className="turn-debug-indicator" />
        <span className="turn-debug-label">AI Engine: Ready</span>
      </div>
    );
  }

  const isNvidia = telemetry.source === 'nvidia';

  return (
    <div className="turn-debug-container">
      <button
        type="button"
        className={`turn-debug-badge ${isNvidia ? 'turn-debug-badge--nvidia' : 'turn-debug-badge--fallback'}`}
        onClick={() => setExpanded(!expanded)}
        title="Click to view AI runtime telemetry"
      >
        <span className="turn-debug-indicator" />
        {isNvidia ? (
          <>
            <Zap size={12} className="turn-debug-icon" />
            <span className="turn-debug-label">NVIDIA NIM Live ({telemetry.latencyMs}ms)</span>
          </>
        ) : (
          <>
            <Activity size={12} className="turn-debug-icon" />
            <span className="turn-debug-label">Procedural Fallback Active</span>
          </>
        )}
      </button>

      {expanded && (
        <div className="turn-debug-popover animate-fade-in-up">
          <div className="turn-debug-popover__header">
            <ShieldCheck size={14} className="turn-debug-popover__icon" />
            <span>AI Runtime Telemetry</span>
          </div>
          <div className="turn-debug-popover__body">
            <div className="turn-debug-row">
              <span className="turn-debug-key">Response Source:</span>
              <span className={`turn-debug-val ${isNvidia ? 'turn-debug-val--nvidia' : 'turn-debug-val--fallback'}`}>
                {isNvidia ? 'NVIDIA NIM (Live Cloud Function)' : 'Deterministic Adaptive Engine'}
              </span>
            </div>
            <div className="turn-debug-row">
              <span className="turn-debug-key">Model:</span>
              <span className="turn-debug-val">{telemetry.model}</span>
            </div>
            <div className="turn-debug-row">
              <span className="turn-debug-key">Latency:</span>
              <span className="turn-debug-val">{telemetry.latencyMs} ms</span>
            </div>
            <div className="turn-debug-row">
              <span className="turn-debug-key">Turn Number:</span>
              <span className="turn-debug-val">{telemetry.turnNumber}</span>
            </div>
            <div className="turn-debug-row">
              <span className="turn-debug-key">Dialogue Context:</span>
              <span className="turn-debug-val">{telemetry.historyLength} turns</span>
            </div>
            {telemetry.failureReason && (
              <div className="turn-debug-row">
                <span className="turn-debug-key">Fallback Notice:</span>
                <span className="turn-debug-val turn-debug-val--warn">{telemetry.failureReason}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
