import type { AvatarProvider } from './AvatarProvider';
import type { AvatarState, TranscriptLine, SessionConfig } from '../../types/session';
import type { DiscoveryContext, Assumption, DiscoveryEvent } from '../../types/discovery';
import type { PitchSetup } from '../../types/pitch';
import { getPersonaById } from '../../data/personas';
import { DiscoveryEngine } from '../../services/ai/DiscoveryEngine';
import { PitchEngine } from '../../services/ai/PitchEngine';
import { NvidiaNimService } from '../../services/ai/NvidiaNimService';
import { SpeechService } from '../../services/ai/SpeechService';

export class MockAvatarProvider implements AvatarProvider {
  private connected = false;
  private config: SessionConfig | null = null;
  private stateCallback: ((state: AvatarState) => void) | null = null;
  private transcriptCallback: ((lines: TranscriptLine[]) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private transcript: TranscriptLine[] = [];
  private sessionEvents: DiscoveryEvent[] = [];

  async connect(config: SessionConfig): Promise<void> {
    this.config = config;
    this.connected = true;
    this.transcript = [];
    this.sessionEvents = [];
    DiscoveryEngine.resetState(config.difficulty);
    PitchEngine.resetHistory();

    // Simulate connection handshake
    await new Promise((resolve) => setTimeout(resolve, 600));
    this.emitState('idle');

    // Emit authentic opening line from customer or investor persona
    const persona = getPersonaById(config.personaId);
    let greeting: string | null = null;

    if (NvidiaNimService.isConfigured() && persona) {
      try {
        greeting = await NvidiaNimService.generateOpening({
          type: config.type,
          persona,
          difficulty: config.difficulty,
          context: config.context,
        });
      } catch {
        // Fall back to engine
      }
    }

    if (!greeting) {
      if (config.type === 'discovery' && persona) {
        if (persona.id === 'skeptic') {
          greeting = "Hi. I saw your request to chat. I've got a few minutes, but just so you know, I'm pretty happy with how we do things today. What's this about?";
        } else if (persona.id === 'busy') {
          greeting = "Hey. I'm between meetings right now, but I can spare a few minutes. What do you need?";
        } else if (persona.id === 'talkative') {
          greeting = "Hello! Great to meet you. I was just reviewing our project schedule and saw your note. Always happy to chat with founders—we've been looking at a lot of new things lately. How can I help?";
        } else if (persona.id === 'polite-agreer') {
          greeting = "Hi! Thanks so much for reaching out. It's really exciting to connect with people building new things. What are you working on?";
        } else if (persona.id === 'frustrated') {
          greeting = "Hey. Honestly it's been a chaotic day with our current systems melting down, but go ahead. What did you want to discuss?";
        } else if (persona.id === 'indifferent') {
          greeting = "Hi. Thanks for reaching out. We're pretty settled with our setup, but happy to answer a couple questions if it helps your research.";
        } else {
          greeting = "Hi there. Thanks for reaching out. What did you want to talk about?";
        }
      } else if (config.type === 'pitch') {
        const pitchSetup = (config.context?.setup as PitchSetup) || { info: { startupName: 'Your Startup' } };
        greeting = PitchEngine.generateOpening(pitchSetup, persona);
      } else {
        greeting = "Hi there. Thanks for reaching out. What did you want to talk about?";
      }
    }

    setTimeout(() => {
      this.emitAvatarMessage(greeting!);
    }, 900);
  }

  disconnect(): void {
    this.connected = false;
    this.config = null;
    SpeechService.stop();
    this.emitState('idle');
  }

  sendUserText(text: string): void {
    if (!this.connected || !this.config) return;

    // Interrupt avatar speech immediately when founder speaks
    SpeechService.stop();

    // Record user message
    const userLine: TranscriptLine = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text,
      timestamp: Date.now(),
    };
    this.transcript.push(userLine);
    this.transcriptCallback?.([...this.transcript]);

    // Set Avatar to thinking
    this.emitState('thinking');

    const persona = getPersonaById(this.config.personaId) || {
      id: 'skeptic',
      category: 'customer' as const,
      name: 'Customer',
      tagline: '',
      description: '',
      behaviorCues: [],
      traits: [],
      difficulty: 'moderate' as const,
      icon: 'User',
    };

    // Attempt NVIDIA NIM LLM turn generation first if API key is active
    (async () => {
      let replyText: string | null = null;

      if (NvidiaNimService.isConfigured()) {
        try {
          const nimResult = await NvidiaNimService.generateTurn({
            type: this.config!.type,
            persona,
            difficulty: this.config!.difficulty,
            context: this.config!.context,
            history: this.transcript,
            latestUserMessage: text,
          });
          if (nimResult) {
            replyText = nimResult.text;
          }
        } catch (err) {
          console.warn('NVIDIA NIM call failed, falling back to procedural engine:', err);
        }
      }

      // Procedural engine fallback if NVIDIA NIM is offline or not configured
      if (!replyText) {
        if (this.config?.type === 'discovery') {
          const setupContext = (this.config.context?.setup as { context?: DiscoveryContext; assumptions?: Assumption[] }) || {};
          const context: DiscoveryContext = setupContext.context || {
            startupName: 'Your Startup',
            whatBuilding: 'A solution',
            targetCustomer: 'Customers',
            problemHypothesis: 'Operational friction',
          };
          const assumptions: Assumption[] = setupContext.assumptions || [];

          const engineResult = DiscoveryEngine.generateTurn({
            context,
            assumptions,
            persona,
            difficulty: this.config.difficulty,
            history: this.transcript,
            latestUserMessage: text,
          });

          replyText = engineResult.text;
          this.sessionEvents.push(...engineResult.events);
        } else if (this.config?.type === 'pitch') {
          const pitchSetup = (this.config.context?.setup as PitchSetup) || { info: { startupName: 'Your Startup' } };
          const pitchResult = PitchEngine.processTurn({
            setup: pitchSetup,
            persona,
            difficulty: this.config.difficulty,
            founderMessage: text,
            turnCount: this.transcript.filter((t) => t.speaker === 'user').length,
          });
          replyText = pitchResult.investorMessage;
        } else {
          replyText = "I see. Could you share more specifics about how your workflow handles that?";
        }
      }

      this.emitAvatarMessage(replyText);
    })();
  }

  getCapturedEvents(): DiscoveryEvent[] {
    return [...this.sessionEvents];
  }

  onAvatarStateChange(cb: (state: AvatarState) => void): void {
    this.stateCallback = cb;
  }

  onTranscriptUpdate(cb: (lines: TranscriptLine[]) => void): void {
    this.transcriptCallback = cb;
  }

  onError(cb: (error: Error) => void): void {
    this.errorCallback = cb;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private emitState(state: AvatarState): void {
    this.stateCallback?.(state);
  }

  private emitAvatarMessage(text: string): void {
    const line: TranscriptLine = {
      id: `avatar-${Date.now()}`,
      speaker: 'avatar',
      text,
      timestamp: Date.now(),
    };
    this.transcript.push(line);
    this.transcriptCallback?.([...this.transcript]);

    this.emitState('speaking');

    // Trigger audible speech synthesis with synchronized state transitions
    SpeechService.speak(text, {
      onStart: () => {
        this.emitState('speaking');
      },
      onEnd: () => {
        this.emitState('listening');
      },
      onError: () => {
        this.emitState('listening');
      },
    });
  }
}
