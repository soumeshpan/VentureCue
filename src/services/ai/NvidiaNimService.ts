/**
 * VentureCue — NVIDIA NIM (NVIDIA Cloud Functions) AI Integration Service
 * Secure client-side service that interfaces with the server-side NVIDIA proxy endpoint (/api/conversation).
 *
 * CRITICAL SECURITY INVARIANT:
 * Zero API keys are stored in client state, localStorage, or frontend bundles.
 * All inference requests are routed through the server proxy which securely injects NVIDIA_API_KEY.
 */

import type { Persona } from '../../types/persona';
import type { Difficulty, TranscriptLine } from '../../types/session';
import type { DiscoveryContext } from '../../types/discovery';
import type { PitchSetup } from '../../types/pitch';
import { CustomerPromptBuilder } from './context/CustomerPromptBuilder';
import { InvestorPromptBuilder } from './context/InvestorPromptBuilder';
import { InputNormalizer } from './context/InputNormalizer';
import { ResponseValidator } from './context/ResponseValidator';
import { NvidiaServerProxy } from '../../server/nvidiaProxy';

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
  private static latestTelemetry: TurnTelemetry | null = null;
  private static serverConfigured: boolean | null = null;

  public static getLatestTelemetry(): TurnTelemetry | null {
    return this.latestTelemetry;
  }

  public static getModel(): string {
    return DEFAULT_MODEL;
  }

  /**
   * Checks if NVIDIA NIM is configured on the server.
   */
  public static async checkServerStatus(): Promise<{
    provider: string;
    model: string;
    isConfigured: boolean;
    configuredVia: string;
  }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          this.serverConfigured = !!data.isConfigured;
          return data;
        }
      } catch {
        // server endpoint offline
      }
    }

    // Node.js test / direct proxy environment
    const isConfigured = NvidiaServerProxy.isConfigured();
    this.serverConfigured = isConfigured;
    return {
      provider: 'NVIDIA NIM',
      model: NvidiaServerProxy.getServerModel(),
      isConfigured,
      configuredVia: 'Server Environment (NVIDIA_API_KEY)',
    };
  }

  public static isConfigured(): boolean {
    if (this.serverConfigured !== null) return this.serverConfigured;
    // In test environment, inspect server proxy configuration directly
    if (typeof window === 'undefined') {
      return NvidiaServerProxy.isConfigured();
    }
    return true; // Assume configured on client until proven otherwise by request
  }

  /**
   * Dispatches inference payload to the server-side proxy.
   */
  private static async callServerProxy(payload: {
    messages: NvidiaMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  }): Promise<{ ok: boolean; status: number; content?: string; error?: string }> {
    // If in browser, make HTTP request to backend /api/conversation
    if (typeof window !== 'undefined') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const response = await fetch('/api/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = (await response.json()) as any;
        return {
          ok: response.ok && data.ok,
          status: response.status,
          content: data.content,
          error: data.error,
        };
      } catch (err: any) {
        return {
          ok: false,
          status: 500,
          error: err.name === 'AbortError' ? 'Proxy request timed out' : 'Failed to reach /api/conversation',
        };
      }
    }

    // In direct Node.js test environment, delegate to NvidiaServerProxy directly
    return NvidiaServerProxy.proxyConversation(payload);
  }

  /**
   * Generates next avatar conversational response using server-proxied NVIDIA NIM.
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
    const turnNumber = params.history.filter((h) => h.speaker === 'user').length + 1;
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
      const proxyResult = await this.callServerProxy({
        messages,
        temperature: type === 'discovery' ? 0.65 : 0.55,
        max_tokens: 130,
        top_p: 0.9,
      });

      if (!proxyResult.ok || !proxyResult.content) {
        console.warn(`Server NVIDIA proxy returned status ${proxyResult.status}: ${proxyResult.error}`);
        this.latestTelemetry = {
          provider: 'NVIDIA NIM',
          model: this.getModel(),
          source: 'deterministic-fallback',
          latencyMs: Date.now() - startTime,
          status: proxyResult.status,
          turnNumber,
          historyLength: history.length,
          failureReason: proxyResult.error || `HTTP ${proxyResult.status}`,
          timestamp: Date.now(),
        };
        return null;
      }

      // 3. Response Validation & Leakage Guardrails
      const validation = ResponseValidator.validate(proxyResult.content, {
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
      }

      console.warn('First LLM attempt failed validation:', validation.failureReason);

      // Retry once via server proxy with direct-answer emphasis
      const retryMessages: NvidiaMessage[] = [
        ...messages,
        {
          role: 'system',
          content:
            "CRITICAL: Do NOT repeat previous sentences. Answer the founder's latest specific question in 1 to 2 direct sentences.",
        },
      ];

      const retryResult = await this.callServerProxy({
        messages: retryMessages,
        temperature: 0.5,
        max_tokens: 100,
      });

      if (retryResult.ok && retryResult.content) {
        const retryVal = ResponseValidator.validate(retryResult.content, {
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
      console.warn('NVIDIA proxy call encountered an error. Falling back to procedural engine:', err);
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
   * Generates opening line via server proxy.
   */
  public static async generateOpening(params: {
    type: 'discovery' | 'pitch';
    persona: Persona;
    difficulty: Difficulty;
    context?: any;
  }): Promise<string | null> {
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
      const proxyResult = await this.callServerProxy({
        messages,
        temperature: 0.6,
        max_tokens: 80,
      });

      if (proxyResult.ok && proxyResult.content) {
        const validation = ResponseValidator.validate(proxyResult.content);
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
   * Generates post-session evaluation report via server proxy.
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
Return ONLY a valid JSON object matching this schema:
{
  "overall": <number 0-100>,
  "discoveryQuality": <number 0-100>,
  "questionQuality": <number 0-100>,
  "listeningQuality": <number 0-100>,
  "evidenceGathering": <number 0-100>,
  "summary": "<2-3 sentence assessment>",
  "strongestMoment": { "label": "<label>", "description": "<description>", "quote": "<quote>" },
  "weakestMoment": { "label": "<label>", "description": "<description>", "quote": "<quote>" },
  "improvements": ["<imp1>", "<imp2>", "<imp3>"],
  "questionsToAsk": ["<q1>", "<q2>", "<q3>"],
  "recommendedNextStep": "<step>"
}`;

    try {
      const proxyResult = await this.callServerProxy({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
      });

      if (proxyResult.ok && proxyResult.content) {
        const jsonMatch = proxyResult.content.match(/\{[\s\S]*\}/);
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
