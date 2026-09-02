import type { AvatarState, TranscriptLine, SessionConfig } from '../../types/session';

export interface AvatarProvider {
  connect(config: SessionConfig): Promise<void>;
  disconnect(): void;
  sendUserText(text: string): void;
  sendUserAudio?(audioChunk: ArrayBuffer): void;
  onAvatarStateChange(cb: (state: AvatarState) => void): void;
  onTranscriptUpdate(cb: (lines: TranscriptLine[]) => void): void;
  onError(cb: (error: Error) => void): void;
  isConnected(): boolean;
}
