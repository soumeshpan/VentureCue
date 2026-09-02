import React from 'react';
import type { AvatarState } from '../../types/session';
import { RealisticAvatarStage } from './RealisticAvatarStage';

interface AvatarStageProps {
  state: AvatarState;
  personaId?: string;
  personaName?: string;
  currentSubtitle?: string;
  videoStreamUrl?: string;
}

export const AvatarStage: React.FC<AvatarStageProps> = ({
  state,
  personaId,
  personaName = 'Avatar',
  currentSubtitle,
  videoStreamUrl,
}) => (
  <RealisticAvatarStage
    state={state}
    personaId={personaId}
    personaName={personaName}
    currentSubtitle={currentSubtitle}
    videoStreamUrl={videoStreamUrl}
  />
);
