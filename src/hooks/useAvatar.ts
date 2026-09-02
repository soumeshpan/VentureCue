import { useEffect, useRef, useCallback } from 'react';
import type { AvatarProvider } from '../providers/avatar/AvatarProvider';
import { MockAvatarProvider } from '../providers/avatar/MockAvatarProvider';
import { useSessionStore } from '../store/sessionStore';
import type { SessionConfig } from '../types/session';

let providerInstance: AvatarProvider | null = null;

export const getAvatarProvider = (): AvatarProvider => {
  if (!providerInstance) {
    providerInstance = new MockAvatarProvider();
  }
  return providerInstance;
};

export const useAvatar = (config: SessionConfig | null) => {
  const { setAvatarState, addTranscriptLine } = useSessionStore();
  const providerRef = useRef<AvatarProvider>(getAvatarProvider());
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!config) return;

    const provider = providerRef.current;

    provider.onAvatarStateChange((state) => {
      setAvatarState(state);
    });

    provider.onTranscriptUpdate((lines) => {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addTranscriptLine(lastLine);
      }
    });

    provider.onError((error) => {
      console.error('Avatar provider error:', error);
      setAvatarState('error');
    });

    provider.connect(config).then(() => {
      isConnectedRef.current = true;
    });

    return () => {
      provider.disconnect();
      isConnectedRef.current = false;
    };
  }, [config?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((text: string) => {
    if (isConnectedRef.current) {
      providerRef.current.sendUserText(text);
    }
  }, []);

  const disconnect = useCallback(() => {
    providerRef.current.disconnect();
    isConnectedRef.current = false;
  }, []);

  return { sendMessage, disconnect };
};
