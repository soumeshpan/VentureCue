/**
 * VentureCue — Response Quality & Leakage Validator
 * Post-processes LLM responses to ensure zero context leakage,
 * no robotic meta-evaluations, and natural human conversational pacing.
 */

import type { TranscriptLine } from '../../../types/session';

export interface ValidationResult {
  isValid: boolean;
  sanitizedText: string;
  failureReason?: string;
  leakageDetected?: boolean;
  isDuplicate?: boolean;
}

export class ResponseValidator {
  private static forbiddenTerms = [
    /\bventurecue\b/i,
    /\bsystem prompt\b/i,
    /\bhidden prompt\b/i,
    /\btrustlevel\b/i,
    /\bpatiencelevel\b/i,
    /\brevealedlayer\b/i,
    /\bgolden signal\b/i,
    /\bdiscovery engine\b/i,
    /\bevaluation score\b/i,
    /\brubric\b/i,
    /\bas an ai\b/i,
    /\bi am an ai\b/i,
    /\blanguage model\b/i,
    /\bin this simulation\b/i,
    /\bdiagnos(is|tic)\b/i,
    /\bmock interview\b/i,
    /\bgeneric ai chatbot\b/i,
    /\baccelerator program\b/i,
    /\bstartup mentor\b/i,
  ];

  /**
   * Validates and sanitizes a raw LLM response.
   */
  public static validate(
    rawResponse: string,
    options?: {
      history?: TranscriptLine[];
      isTalkativePersona?: boolean;
    }
  ): ValidationResult {
    if (!rawResponse || !rawResponse.trim()) {
      return {
        isValid: false,
        sanitizedText: '',
        failureReason: 'Empty response',
      };
    }

    // 1. Clean meta wrappers & role prefixes
    let text = rawResponse
      .replace(/^["']|["']$/g, '')
      .replace(/^(Customer|Investor|Persona|Victoria|Marcus|Elena|Sarah):\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 2. Check for Forbidden Term / Internal Concept Leakage
    for (const pattern of this.forbiddenTerms) {
      if (pattern.test(text)) {
        return {
          isValid: false,
          sanitizedText: text,
          failureReason: `Detected forbidden term / leakage matching ${pattern}`,
          leakageDetected: true,
        };
      }
    }

    // 3. Check for Repetition Against Recent Assistant Turns
    if (options?.history && options.history.length > 0) {
      const recentAvatarLines = options.history
        .filter((h) => h.speaker === 'avatar')
        .slice(-3)
        .map((h) => h.text.toLowerCase().trim());

      const lowerCurrent = text.toLowerCase();
      for (const prev of recentAvatarLines) {
        if (prev === lowerCurrent || (prev.length > 30 && lowerCurrent.includes(prev.slice(0, 30)))) {
          return {
            isValid: false,
            sanitizedText: text,
            failureReason: 'Response is near-duplicate of recent assistant turn',
            isDuplicate: true,
          };
        }
      }
    }

    // 4. Excessive Monologue Check (> 140 words in a single conversational turn)
    const wordCount = text.split(/\s+/).length;
    const maxAllowedWords = options?.isTalkativePersona ? 150 : 110;
    if (wordCount > maxAllowedWords) {
      return {
        isValid: false,
        sanitizedText: text,
        failureReason: `Response too verbose (${wordCount} words)`,
      };
    }

    return {
      isValid: true,
      sanitizedText: text,
    };
  }
}
