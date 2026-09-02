import React, { useRef, useEffect } from 'react';
import type { TranscriptLine } from '../../types/session';
import './TranscriptPanel.css';

interface TranscriptPanelProps {
  lines: TranscriptLine[];
  personaName?: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  lines,
  personaName = 'Avatar',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines.length]);

  return (
    <div className="transcript-panel" role="log" aria-live="polite" aria-label="Conversation transcript">
      {lines.length === 0 ? (
        <div className="transcript-panel__empty">
          <p>The conversation will appear here.</p>
        </div>
      ) : (
        <div className="transcript-panel__messages">
          {lines.map((line) => (
            <div
              key={line.id}
              className={`transcript-message transcript-message--${line.speaker} animate-fade-in-up`}
            >
              <span className="transcript-message__speaker">
                {line.speaker === 'user' ? 'You' : personaName}
              </span>
              <p className="transcript-message__text">{line.text}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
