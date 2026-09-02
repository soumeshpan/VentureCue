/**
 * VentureCue — Input Normalizer & Quality Inspector
 * Pre-processes founder audio/text inputs before passing to LLM context.
 *
 * CRITICAL REQUIREMENTS:
 * - Preserves the raw founder transcript untouched for authentic evidence evaluation.
 * - Detects malformed/garbled speech-to-text fragments.
 * - Identifies prompt injection attempts safely.
 */

export interface InputAnalysisResult {
  rawInput: string;
  normalizedText: string;
  isMalformedOrGarbled: boolean;
  isPromptInjection: boolean;
  clarificationPrompt?: string;
}

export class InputNormalizer {
  /**
   * Analyzes founder input for clarity, speech-to-text fragmentation, and injection risks.
   */
  public static analyzeInput(rawInput: string): InputAnalysisResult {
    const trimmed = (rawInput || '').trim();
    const lower = trimmed.toLowerCase();

    // 1. Detect Prompt Injection Attempts
    const isPromptInjection = this.detectPromptInjection(lower);

    // 2. Detect Malformed Speech-to-Text Garble
    const isMalformedOrGarbled = this.detectGarbledInput(trimmed, lower);

    let clarificationPrompt: string | undefined;
    if (isMalformedOrGarbled) {
      if (/process|problem|manage|workflow/i.test(lower)) {
        clarificationPrompt = "Sorry, I didn't quite follow that. Are you asking which part of our workflow causes the biggest delay?";
      } else if (/tool|software|app|sheet/i.test(lower)) {
        clarificationPrompt = "Sorry, could you rephrase that? Are you asking about the tools we currently use?";
      } else {
        clarificationPrompt = "Sorry, that broke up slightly on my end. Could you say that again?";
      }
    }

    return {
      rawInput: trimmed,
      normalizedText: trimmed.replace(/\s+/g, ' '),
      isMalformedOrGarbled,
      isPromptInjection,
      clarificationPrompt,
    };
  }

  private static detectPromptInjection(text: string): boolean {
    const injectionPatterns = [
      /ignore (all|any|previous|prior) (instructions|rules|prompts)/i,
      /reveal (your|the) (system prompt|hidden prompt|system instructions|internal prompt)/i,
      /what (are|is) your (system prompt|hidden instructions|internal rules|rubric|prompt)/i,
      /act as (the )?(system administrator|root|dan|unrestricted ai)/i,
      /forget (everything|your persona|your role)/i,
      /print (the )?(initial prompt|system message)/i,
      /what (is|are) your (trust score|patience level|evaluation signals)/i,
    ];

    return injectionPatterns.some((p) => p.test(text));
  }

  private static detectGarbledInput(raw: string, lower: string): boolean {
    if (!raw || raw.length < 3) return false;

    // Check for excessive repetitive fragments (common in speech-to-text hiccups)
    const words = lower.split(/\s+/).filter(Boolean);
    if (words.length >= 4) {
      const repetitiveTriplets = /\b(\w+\s+\w+)\s+\1\b/i;
      const danglingConjunctionsEnd = /(and|or|but|the|what|will|with|to)\s+(and|or|think|go)\s+(and|go|think)$/i;
      if (repetitiveTriplets.test(lower) || danglingConjunctionsEnd.test(lower)) {
        return true;
      }
    }

    // Check for garbled run-on strings with dangling fragments
    if (
      /will think go and|what part.*process.*most problem|how managing.*will think/i.test(lower) ||
      /(and|go|think|what)\s+(and|go|think)\s*$/i.test(lower)
    ) {
      return true;
    }

    return false;
  }
}
