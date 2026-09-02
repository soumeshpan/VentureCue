import React from 'react';
import type { AvatarState } from '../../types/session';
import { Human3DAvatar } from './Human3DAvatar';
import './RealisticAvatarStage.css';

interface RealisticAvatarStageProps {
  state: AvatarState;
  personaId?: string;
  personaName?: string;
  currentSubtitle?: string;
  videoStreamUrl?: string; // Provider-agnostic: supports WebRTC live video when Tavus/HeyGen connected
}

export const RealisticAvatarStage: React.FC<RealisticAvatarStageProps> = ({
  state,
  personaId = 'skeptic',
  personaName = 'The Skeptic',
  currentSubtitle,
  videoStreamUrl,
}) => {
  const stateClass = `avatar-stage--${state}`;

  return (
    <div className={`avatar-stage-container ${stateClass}`} aria-label={`3D Avatar: ${personaName}`}>
      {/* 3D Human Avatar Viewport (Video-Call Composition) */}
      <div className="avatar-viewport">
        {videoStreamUrl ? (
          // WebRTC / Live Stream Provider Fallback (Tavus / HeyGen / LiveKit)
          <video
            src={videoStreamUrl}
            autoPlay
            playsInline
            className="avatar-video-stream"
          />
        ) : (
          // Three.js Realistic 3D Human Participant Canvas
          <div className="avatar-canvas">
            <Human3DAvatar
              state={state}
              personaId={personaId}
              personaName={personaName}
            />

            {/* Audio Waveform Reaction Bar */}
            {(state === 'speaking' || state === 'listening') && (
              <div className="avatar-audio-waves" aria-hidden="true">
                <span className="wave-bar bar-1" />
                <span className="wave-bar bar-2" />
                <span className="wave-bar bar-3" />
                <span className="wave-bar bar-4" />
                <span className="wave-bar bar-5" />
                <span className="wave-bar bar-6" />
                <span className="wave-bar bar-7" />
              </div>
            )}
          </div>
        )}

        {/* State Badge Overlay */}
        <div className="avatar-state-pill">
          <span className={`state-dot state-dot--${state}`} />
          <span className="state-label">
            {state === 'speaking'
              ? '● Speaking'
              : state === 'listening'
              ? '● Listening'
              : state === 'thinking'
              ? '● Thinking…'
              : state === 'error'
              ? '● Connection Error'
              : '● Ready'}
          </span>
        </div>
      </div>

      {/* Spoken Subtitle Banner */}
      {currentSubtitle && (
        <div className="avatar-subtitle-container animate-fade-in">
          <p className="avatar-subtitle-text">"{currentSubtitle}"</p>
        </div>
      )}
    </div>
  );
};
