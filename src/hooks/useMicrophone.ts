import { useState, useCallback, useRef, useEffect } from 'react';

export type MicrophoneStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'not-supported'
  | 'error';

export const useMicrophone = () => {
  const [status, setStatus] = useState<MicrophoneStatus>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('not-supported');
      return false;
    }

    setStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStatus('active');
      return true;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      }
      return false;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (status === 'active' && streamRef.current) {
      setIsRecording(true);
    }
  }, [status]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const release = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStatus('idle');
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      release();
    };
  }, [release]);

  const permissionDeniedMessage =
    'Microphone access was denied. Please allow microphone access in your browser settings and refresh the page.';

  const notSupportedMessage =
    'Your browser does not support microphone access. Please use a modern browser like Chrome or Firefox.';

  const errorMessage = status === 'denied'
    ? permissionDeniedMessage
    : status === 'not-supported'
    ? notSupportedMessage
    : null;

  return {
    status,
    isRecording,
    requestPermission,
    startRecording,
    stopRecording,
    release,
    errorMessage,
  };
};
