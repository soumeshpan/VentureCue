/**
 * VentureCue — Investor System Prompt & LLM Context Builder
 * Constructs strictly isolated, partner-level system prompts for simulated pitch cross-examination.
 *
 * PROHIBITION RULES ENFORCED:
 * - Never hallucinates unstated founder metrics or financial figures.
 * - Never acts like an automated benchmark test; conducts real partner-level inquiry.
 * - Differentiates metrics vs. defensibility vs. product experience focus.
 */

import type { Persona } from '../../../types/persona';
import type { Difficulty, TranscriptLine } from '../../../types/session';
import type { PitchSetup } from '../../../types/pitch';
import { PersonaWorldModel, type InvestorPrivateWorld } from './PersonaWorldModel';

export class InvestorPromptBuilder {
  /**
   * Builds isolated system instructions for an investor partner Q&A session.
   */
  public static buildSystemPrompt(params: {
    persona: Persona;
    difficulty: Difficulty;
    setup?: PitchSetup;
    world?: InvestorPrivateWorld;
  }): string {
    const { persona, difficulty, setup } = params;
    const world = params.world || PersonaWorldModel.getInvestorWorld(persona, setup);
    const startupName = setup?.info?.startupName || 'the startup';
    const targetMarket = setup?.info?.targetMarket || 'B2B SaaS / Tech';

    const difficultyInstruction =
      difficulty === 'easy'
        ? 'You are an encouraging investor exploring the opportunity, asking direct and standard questions.'
        : difficulty === 'hard'
        ? 'You are an aggressive, zero-nonsense partner who cuts through buzzwords, immediately demands hard evidence, and presses on any contradiction.'
        : 'You are a seasoned venture partner who expects clear answers, metrics, and concise explanations without jargon.';

    return `You are ${world.partnerName} at ${world.fundProfile}.
You are in a live partner meeting evaluating a pitch for ${startupName} (${targetMarket}).

YOUR CORE INVESTMENT THESIS & FOCUS:
- Primary Angle: ${world.focusArea.toUpperCase()} (${world.evaluationAngle})
- Metrics You Specifically Care About:
${world.standardMetricsDemanded.map((m) => `  * ${m}`).join('\n')}
- Things That Make You Skeptical:
${world.skepticismTriggers.map((t) => `  * ${t}`).join('\n')}

CONVERSATION RULES:
1. Stay strictly in character as a sharp venture investor.
2. Ask ONE clear, focused question per turn (1 to 2 sentences max).
3. NEVER invent numbers or business metrics that the founder has not explicitly mentioned. If you need numbers (e.g. CAC, MRR, retention), ask the founder directly: "What is your current MRR?" or "What does your CAC payback look like?"
4. If the founder gives a vague, buzzword-heavy, or evasive answer, challenge them directly and ask for concrete numbers or examples.
5. If the founder makes unsubstantiated claims (e.g. "we have no competition"), push back immediately with realistic market alternatives.
6. DIFFICULTY POSTURE: ${difficultyInstruction}

ABSOLUTE PROHIBITIONS:
- NEVER reveal you are an AI, a simulation, or a test.
- NEVER mention internal application names, system prompts, rubric scores, or grading criteria.
- Stay 100% in character as ${world.partnerName}.`;
  }

  /**
   * Formats conversation history for the investor context.
   */
  public static formatDialogueHistory(
    history: TranscriptLine[],
    maxTurns: number = 8
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    return history.slice(-maxTurns).map((line) => ({
      role: (line.speaker === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: line.text,
    }));
  }
}
