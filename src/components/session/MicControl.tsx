import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, AudioWaveform, Volume2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { SpeechService } from '../../services/ai/SpeechService';
import './MicControl.css';

interface MicControlProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  micStatus?: 'idle' | 'requesting' | 'active' | 'denied' | 'not-supported' | 'error';
  errorMessage?: string | null;
}

export const MicControl: React.FC<MicControlProps> = ({
  onSendMessage,
  disabled = false,
  micStatus = 'idle',
  errorMessage,
}) => {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Initialize Speech Recognition if browser supports it
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setTextInput((prev) => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
          setInterimText('');
        } else {
          setInterimText(currentInterim);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const toggleRecording = () => {
    if (disabled) return;

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
    } else {
      // User is starting to speak: interrupt any ongoing avatar speech immediately
      SpeechService.stop();

      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch {
        // Fallback simulate voice input listening
        setIsRecording(true);
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = () => {
    const trimmed = (textInput + (interimText ? ` ${interimText}` : '')).trim();
    if (!trimmed || disabled || isSubmitting) return;

    setIsSubmitting(true);

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
    }

    onSendMessage(trimmed);
    setTextInput('');
    setInterimText('');

    // Unlock after 400ms to prevent double-submit
    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMicError = micStatus === 'denied' || micStatus === 'not-supported';

  return (
    <div className="mic-control-container">
      {/* Prominent Voice / Mic Status Bar */}
      {isRecording && (
        <div className="mic-live-indicator animate-fade-in">
          <div className="mic-live-pulse" />
          <span className="mic-live-text">Listening to your voice…</span>
          <div className="mic-live-waves">
            <span className="live-bar bar-a" />
            <span className="live-bar bar-b" />
            <span className="live-bar bar-c" />
            <span className="live-bar bar-d" />
          </div>
        </div>
      )}

      {hasMicError && errorMessage && (
        <div className="mic-error-banner" role="alert">
          <MicOff size={14} />
          <span>Microphone access unavailable. You can seamlessly type responses below.</span>
        </div>
      )}

      {/* Input Row */}
      <div className="mic-input-box">
        {/* Toggle Mic Button */}
        <button
          type="button"
          className={`mic-button ${isRecording ? 'mic-button--recording' : ''}`}
          onClick={toggleRecording}
          disabled={disabled || hasMicError}
          title={isRecording ? 'Click to stop listening' : 'Click to speak via microphone'}
          aria-label={isRecording ? 'Stop listening' : 'Start speaking'}
        >
          {isRecording ? <Mic size={20} className="mic-icon--active" /> : <Mic size={20} />}
        </button>

        {/* Text Input with Voice Transcript preview */}
        <div className="mic-input-wrapper">
          <input
            type="text"
            className="mic-text-input"
            placeholder={
              isRecording
                ? 'Speak now… (or type to edit)'
                : 'Type your response to the customer or click the mic to speak…'
            }
            value={textInput + (interimText ? ` ${interimText}` : '')}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Your conversation response"
          />
        </div>

        {/* Send Button */}
        <Button
          variant="primary"
          size="md"
          glow={!!(textInput || interimText).trim()}
          onClick={handleSend}
          disabled={disabled || !(textInput || interimText).trim()}
          aria-label="Send response"
          rightIcon={<Send size={15} />}
        >
          Send
        </Button>
      </div>
    </div>
  );
};
