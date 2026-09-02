/**
 * VentureCue — NVIDIA NIM (NVIDIA Cloud Functions) AI Integration Service
 * Interfaces with NVIDIA NIM LLM endpoints (e.g., meta/llama-3.2-11b-vision-instruct)
 * to power real-time adaptive customer discovery, investor cross-examination, and avatar dialogues.
 */

import type { Persona } from '../../types/persona';
import type { Difficulty, TranscriptLine } from '../../types/session';
import type { DiscoveryContext } from '../../types/discovery';
import type { PitchSetup } from '../../types/pitch';
import { CustomerPromptBuilder } from './context/CustomerPromptBuilder';
import { InvestorPromptBuilder } from './context/InvestorPromptBuilder';
import { InputNormalizer } from './context/InputNormalizer';
import { ResponseValidator } from './context/ResponseValidator';

const DEFAULT_NVIDIA_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'meta/llama-3.2-11b-vision-instruct';

export interface NvidiaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TurnTelemetry {
  provider: 'NVIDIA NIM';
  model: string;
  source: 'nvidia' | 'deterministic-fallback';
  latencyMs: number;
  status: number | 'error' | 'clarification';
  turnNumber: number;
  historyLength: number;
  failureReason?: string;
  timestamp: number;
}

export class NvidiaNimService {
  private static localKeyStorageKey = 'venturecue-nvidia-api-key';
  private static fallbackApiKey = '';
  private static inMemoryApiKey = '';

  private static latestTelemetry: TurnTelemetry | null = null;

  public static getLatestTelemetry(): TurnTelemetry | null {
    return this.latestTelemetry;
  }

  public static getApiKey(): string {
    if (this.inMemoryApiKey) return this.inMemoryApiKey;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const fromStorage = localStorage.getItem(this.localKeyStorageKey);
        if (fromStorage && fromStorage.trim()) return fromStorage.trim();
      } catch {
        // ignore
      }
    }

    try {
      const fromEnv = (import.meta as any).env?.VITE_NVIDIA_API_KEY;
      if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim();
    } catch {
      // ignore
    }

    try {
      const gProcess = (globalThis as any).process;
      if (gProcess && gProcess.env?.VITE_NVIDIA_API_KEY) {
        return gProcess.env.VITE_NVIDIA_API_KEY.trim();
      }
    } catch {
      // ignore
    }

    return this.fallbackApiKey;
  }

  public static setApiKey(key: string): void {
    this.inMemoryApiKey = key ? key.trim() : '';

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (key.trim()) {
          localStorage.setItem(this.localKeyStorageKey, key.trim());
        } else {
          localStorage.removeItem(this.localKeyStorageKey);
        }
      } catch {
        // ignore
      }
    }
  }

  public static getModel(): string {
    try {
      return (import.meta as any).env?.VITE_NVIDIA_MODEL || DEFAULT_MODEL;
    } catch {
      return DEFAULT_MODEL;
    }
  }

  public static isConfigured(): boolean {
    const key = this.getApiKey();
    return !!key && key.startsWith('nvapi-');
  }

  public static maskApiKey(key?: string): string {
    const targetKey = key || this.getApiKey();
    if (!targetKey) return 'Not configured';
    if (targetKey.length < 12) return '••••••••';
    return `${targetKey.slice(0, 6)}••••••••••••${targetKey.slice(-4)}`;
  }

  /**
   * Generates next avatar conversational response using NVIDIA NIM API with strict context isolation.
   * Gracefully returns null if network fails or validation fails, allowing seamless procedural fallback.
   */
  public static async generateTurn(params: {
    type: 'discovery' | 'pitch';
    persona: Persona;
    difficulty: Difficulty;
    context?: any;
    history: TranscriptLine[];
    latestUserMessage: string;
  }): Promise<{ text: string; source: 'nvidia' | 'deterministic-fallback' } | null> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const turnNumber = params.history.filter((h) => h.speaker === 'user').length + 1;

    if (!apiKey) {
      this.latestTelemetry = {
        provider: 'NVIDIA NIM',
        model: this.getModel(),
        source: 'deterministic-fallback',
        latencyMs: 0,
        status: 'error',
        turnNumber,
        historyLength: params.history.length,
        failureReason: 'No API key configured',
        timestamp: Date.now(),
      };
      return null;
    }

    const { type, persona, difficulty, context, history, latestUserMessage } = params;

    // 1. Input Analysis & Normalization
    const inputAnalysis = InputNormalizer.analyzeInput(latestUserMessage);

    // If adversarial prompt injection is detected, respond in character safely
    if (inputAnalysis.isPromptInjection) {
      this.latestTelemetry = {
        provider: 'NVIDIA NIM',
        model: this.getModel(),
        source: 'nvidia',
        latencyMs: Date.now() - startTime,
        status: 200,
        turnNumber,
        historyLength: history.length,
        timestamp: Date.now(),
      };
      const text =
        type === 'discovery'
          ? `I'm not sure what you mean by system instructions or hidden prompts. I'm just here to discuss our day-to-day workflow. Was there a specific question you had about our process?`
          : `Let's focus on the actual business and financials rather than hypothetical prompt games. What is your actual customer retention?`;
      return { text, source: 'nvidia' };
    }

    // If speech-to-text was garbled/malformed, return natural conversational clarification
    if (inputAnalysis.isMalformedOrGarbled && inputAnalysis.clarificationPrompt) {
      this.latestTelemetry = {
        provider: 'NVIDIA NIM',
        model: this.getModel(),
        source: 'nvidia',
        latencyMs: Date.now() - startTime,
        status: 'clarification',
        turnNumber,
        historyLength: history.length,
        timestamp: Date.now(),
      };
      return { text: inputAnalysis.clarificationPrompt, source: 'nvidia' };
    }

    // 2. Build Isolated System Prompt & Context
    const systemPrompt =
      type === 'discovery'
        ? CustomerPromptBuilder.buildSystemPrompt({
            persona,
            difficulty,
            context: (context?.setup?.context as DiscoveryContext) || context?.context,
          })
        : InvestorPromptBuilder.buildSystemPrompt({
            persona,
            difficulty,
            setup: (context?.setup as PitchSetup) || context,
          });

    const dialogueMessages =
      type === 'discovery'
        ? CustomerPromptBuilder.formatDialogueHistory(history, 10)
        : InvestorPromptBuilder.formatDialogueHistory(history, 10);

    const messages: NvidiaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...dialogueMessages,
      { role: 'user', content: inputAnalysis.normalizedText },
    ];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000); // 9-second safety timeout

      const response = await fetch(DEFAULT_NVIDIA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages,
          temperature: type === 'discovery' ? 0.65 : 0.55,
          max_tokens: 130,
          top_p: 0.9,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`NVIDIA NIM API returned status ${response.status}.`);
        this.latestTelemetry = {
          provider: 'NVIDIA NIM',
          model: this.getModel(),
          source: 'deterministic-fallback',
          latencyMs: Date.now() - startTime,
          status: response.status,
          turnNumber,
          historyLength: history.length,
          failureReason: `HTTP ${response.status}`,
          timestamp: Date.now(),
        };
        return null;
      }

      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content?.trim();

      if (rawReply) {
        // 3. Response Validation & Leakage Guardrails
        const validation = ResponseValidator.validate(rawReply, {
          history,
          isTalkativePersona: persona.id === 'talkative',
        });

        if (validation.isValid) {
          this.latestTelemetry = {
            provider: 'NVIDIA NIM',
            model: this.getModel(),
            source: 'nvidia',
            latencyMs: Date.now() - startTime,
            status: 200,
            turnNumber,
            historyLength: history.length,
            timestamp: Date.now(),
          };
          return { text: validation.sanitizedText, source: 'nvidia' };
        } else {
          console.warn('First LLM attempt failed validation:', validation.failureReason);

          // Retry once with direct answer emphasis
          const retryMessages: NvidiaMessage[] = [
            ...messages,
            {
              role: 'system',
              content:
                'CRITICAL: Do NOT repeat previous sentences. Answer the founder\'s latest specific question in 1 to 2 direct sentences.',
            },
          ];

          const retryResponse = await fetch(DEFAULT_NVIDIA_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: this.getModel(),
              messages: retryMessages,
              temperature: 0.5,
              max_tokens: 100,
            }),
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const retryRaw = retryData.choices?.[0]?.message?.content?.trim();
            if (retryRaw) {
              const retryVal = ResponseValidator.validate(retryRaw, {
                history,
                isTalkativePersona: persona.id === 'talkative',
              });
              if (retryVal.isValid) {
                this.latestTelemetry = {
                  provider: 'NVIDIA NIM',
                  model: this.getModel(),
                  source: 'nvidia',
                  latencyMs: Date.now() - startTime,
                  status: 200,
                  turnNumber,
                  historyLength: history.length,
                  timestamp: Date.now(),
                };
                return { text: retryVal.sanitizedText, source: 'nvidia' };
              }
            }
          }
        }
      }

      this.latestTelemetry = {
        provider: 'NVIDIA NIM',
        model: this.getModel(),
        source: 'deterministic-fallback',
        latencyMs: Date.now() - startTime,
        status: 200,
        turnNumber,
        historyLength: history.length,
        failureReason: 'Response failed validation after retry',
        timestamp: Date.now(),
      };
      return null;
    } catch (err) {
      console.warn('NVIDIA NIM API turn generation encountered an error. Falling back safely to procedural engine:', err);
      this.latestTelemetry = {
        provider: 'NVIDIA NIM',
        model: this.getModel(),
        source: 'deterministic-fallback',
        latencyMs: Date.now() - startTime,
        status: 'error',
        turnNumber,
        historyLength: history.length,
        failureReason: String(err),
        timestamp: Date.now(),
      };
      return null;
    }
  }

  /**
   * Generates dynamic opening greeting line for the avatar using NVIDIA NIM.
   */
  public static async generateOpening(params: {
    type: 'discovery' | 'pitch';
    persona: Persona;
    difficulty: Difficulty;
    context?: any;
  }): Promise<string | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const { type, persona, difficulty, context } = params;

    const systemPrompt =
      type === 'discovery'
        ? CustomerPromptBuilder.buildSystemPrompt({
            persona,
            difficulty,
            context: (context?.setup?.context as DiscoveryContext) || context?.context,
          })
        : InvestorPromptBuilder.buildSystemPrompt({
            persona,
            difficulty,
            setup: (context?.setup as PitchSetup) || context,
          });

    const messages: NvidiaMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          type === 'discovery'
            ? 'The founder just connected to the call. Say your initial 1-sentence opening greeting to begin the interview.'
            : 'The founder has stepped up to pitch their startup. Say your initial 1-2 sentence opening prompt as an investor.',
      },
    ];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(DEFAULT_NVIDIA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages,
          temperature: 0.6,
          max_tokens: 80,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim();

      if (reply) {
        const validation = ResponseValidator.validate(reply);
        if (validation.isValid) {
          return validation.sanitizedText;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Generates live comprehensive post-session evaluation using NVIDIA NIM LLM.
   */
  public static async generateEvaluation(params: {
    type: 'discovery' | 'pitch';
    personaName: string;
    difficulty: Difficulty;
    transcript: TranscriptLine[];
    context?: any;
  }): Promise<{
    overall?: number;
    discoveryQuality?: number;
    questionQuality?: number;
    listeningQuality?: number;
    evidenceGathering?: number;
    summary?: string;
    strongestMoment?: { label: string; description: string; quote?: string };
    weakestMoment?: { label: string; description: string; quote?: string };
    improvements?: string[];
    questionsToAsk?: string[];
    recommendedNextStep?: string;
  } | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const { type, personaName, difficulty, transcript, context } = params;
    const formattedTranscript = transcript
      .map((t) => `${t.speaker === 'user' ? 'Founder' : personaName}: "${t.text}"`)
      .join('\n');

    const prompt = `You are an elite venture partner and customer discovery interview evaluator.
Analyze this full conversation transcript:
SESSION TYPE: ${type.toUpperCase()}
PARTICIPANT: ${personaName}
DIFFICULTY: ${difficulty.toUpperCase()}
STARTUP CONTEXT: ${JSON.stringify(context || {})}

TRANSCRIPT:
${formattedTranscript}

Perform a rigorous evaluation of the founder's questioning technique, problem validation, listening quality, and avoidance of premature selling.
Return ONLY a valid JSON object matching this schema (do not include markdown formatting or extra text):
{
  "overall": <number 0-100>,
  "discoveryQuality": <number 0-100>,
  "questionQuality": <number 0-100>,
  "listeningQuality": <number 0-100>,
  "evidenceGathering": <number 0-100>,
  "summary": "<2-3 sentence executive assessment of the founder's performance>",
  "strongestMoment": {
    "label": "<brief label>",
    "description": "<why this was effective>",
    "quote": "<exact quote from founder or participant>"
  },
  "weakestMoment": {
    "label": "<brief label>",
    "description": "<how it could be improved>",
    "quote": "<exact quote from founder or participant>"
  },
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>", "<actionable improvement 3>"],
  "questionsToAsk": ["<recommended open question 1>", "<recommended open question 2>", "<recommended open question 3>"],
  "recommendedNextStep": "<primary actionable focus for next practice session>"
}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(DEFAULT_NVIDIA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 600,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}
