/**
 * VentureCue — Speech Synthesis & Voice Audio Engine
 * Provides realistic audible text-to-speech for 3D human avatars
 * with natural voice selection and synchronized speech event callbacks.
 */

export class SpeechService {
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static selectedVoice: SpeechSynthesisVoice | null = null;
  private static voiceLoaded = false;

  private static initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Find best natural female English voice
        this.selectedVoice =
          voices.find((v) => (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Zira') || v.name.includes('Google US English')) && v.lang.startsWith('en')) ||
          voices.find((v) => v.name.includes('Natural') && v.lang.startsWith('en')) ||
          voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0] ||
          null;
        this.voiceLoaded = true;
      }
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  /**
   * Speaks the given text using browser Web Speech Synthesis.
   * Invokes onStart, onEnd, and onError callbacks for avatar lip-sync sync.
   */
  public static speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      pitch?: number;
      rate?: number;
    }
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options?.onStart?.();
      setTimeout(() => options?.onEnd?.(), Math.min(5000, text.length * 50));
      return;
    }

    try {
      this.stop();

      if (!this.voiceLoaded) {
        this.initVoices();
      }

      // Clean text of markdown or special characters before speaking
      const cleanText = text
        .replace(/[*_~`#\[\]\(\)]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        options?.onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.08;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        console.warn('SpeechSynthesis error:', e);
        options?.onError?.(e);
        options?.onEnd?.();
      };

      // Resume in case speech synthesis was paused by browser policy
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
      options?.onError?.(err);
      options?.onEnd?.();
    }
  }

  /**
   * Immediately stops any ongoing speech playback.
   */
  public static stop(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    } catch {
      // ignore
    }
  }

  public static isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }
}
