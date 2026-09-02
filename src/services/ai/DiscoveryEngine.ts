/**
 * VentureCue — Advanced Customer Discovery Adaptive Engine
 * Simulates realistic B2B/B2C customer interviews with contextual progressive disclosure,
 * grounded private world context, question intent detection, and dynamic non-repetitive responses.
 */

import type { Persona } from '../../types/persona';
import type { Difficulty, TranscriptLine } from '../../types/session';
import type { DiscoveryContext, Assumption, DiscoveryEvent } from '../../types/discovery';
import { PersonaWorldModel } from './context/PersonaWorldModel';

export interface CustomerInternalState {
  trustLevel: number; // 0 - 100
  patienceLevel: number; // 0 - 100
  engagementLevel: number; // 0 - 100
  revealedLayer: number; // 1 to 6
  leadingQuestionsCount: number;
  openQuestionsCount: number;
  pastBehaviorQuestionsCount: number;
  pitchAttemptsCount: number;
  knownTools: string[];
  disclosedFacts: Set<string>;
  usedResponseKeys: Set<string>;
  turnNumber: number;
}

export interface EngineTurnResult {
  text: string;
  events: DiscoveryEvent[];
  updatedState: CustomerInternalState;
  customerState: CustomerInternalState;
  source: 'deterministic-fallback';
}

export class DiscoveryEngine {
  private static activeState: CustomerInternalState = {
    trustLevel: 50,
    patienceLevel: 60,
    engagementLevel: 50,
    revealedLayer: 1,
    leadingQuestionsCount: 0,
    openQuestionsCount: 0,
    pastBehaviorQuestionsCount: 0,
    pitchAttemptsCount: 0,
    knownTools: [],
    disclosedFacts: new Set<string>(),
    usedResponseKeys: new Set<string>(),
    turnNumber: 0,
  };

  public static resetState(difficulty: Difficulty = 'moderate') {
    const basePatience = difficulty === 'easy' ? 85 : difficulty === 'hard' ? 40 : 60;
    const baseTrust = difficulty === 'easy' ? 65 : difficulty === 'hard' ? 35 : 50;

    this.activeState = {
      trustLevel: baseTrust,
      patienceLevel: basePatience,
      engagementLevel: 50,
      revealedLayer: 1,
      leadingQuestionsCount: 0,
      openQuestionsCount: 0,
      pastBehaviorQuestionsCount: 0,
      pitchAttemptsCount: 0,
      knownTools: [],
      disclosedFacts: new Set<string>(),
      usedResponseKeys: new Set<string>(),
      turnNumber: 0,
    };
  }

  public static getInternalState(): CustomerInternalState {
    return { ...this.activeState };
  }

  public static generateTurn(params: {
    context: DiscoveryContext;
    assumptions: Assumption[];
    persona: Persona;
    difficulty: Difficulty;
    history: TranscriptLine[];
    latestUserMessage: string;
  }): EngineTurnResult {
    const { context, persona, difficulty, history, latestUserMessage } = params;
    const msg = latestUserMessage.trim().toLowerCase();
    const turnCount = history.filter((h) => h.speaker === 'user').length + 1;
    this.activeState.turnNumber = turnCount;
    const events: DiscoveryEvent[] = [];

    const world = PersonaWorldModel.getCustomerWorld(persona, context);
    if (this.activeState.knownTools.length === 0) {
      this.activeState.knownTools = [...world.currentTools];
    }

    // 1. Behavior & Intent Analysis of Founder Input
    const isPromptInjection = this.detectPromptInjection(msg);
    const isMalformedOrGarbled = this.detectGarbledInput(msg);
    const isLeading = this.detectLeadingQuestion(msg);
    const isPrematurePitch = this.detectPrematurePitch(msg, turnCount);
    const isOpenQuestion = this.detectOpenQuestion(msg);
    const isPastBehavior = this.detectPastBehavior(msg);
    const isRecoveryOrFollowUp = this.detectRecoveryOrFollowUp(msg);
    const isStepByStep = this.detectStepByStep(msg);
    const isToolQuestion = this.detectToolQuestion(msg);
    const isFrequencyOrImpact = this.detectFrequencyOrImpact(msg);
    const isAskingAboutSwitching = this.detectSwitchingOrBudget(msg);
    const isRepetitive = this.detectRepetitiveQuestion(msg, this.activeState, history);
    const isInvestigatingContradiction = this.detectContradictionProbing(msg);

    // 2. Telemetry & Event Logging
    if (isLeading) {
      this.activeState.leadingQuestionsCount += 1;
      this.activeState.trustLevel = Math.max(10, this.activeState.trustLevel - 15);
      events.push({
        id: `evt-${Date.now()}-lead`,
        type: 'leading_question',
        timestamp: Date.now(),
        quote: latestUserMessage,
        note: 'Leading question attempts to validate solution without organic customer pain discovery.',
        metadata: { layer: this.activeState.revealedLayer },
      });
    }

    if (isPrematurePitch) {
      this.activeState.pitchAttemptsCount += 1;
      this.activeState.patienceLevel = Math.max(10, this.activeState.patienceLevel - 20);
      events.push({
        id: `evt-${Date.now()}-pitch`,
        type: 'premature_pitch',
        timestamp: Date.now(),
        quote: latestUserMessage,
        note: 'Premature solution pitch before problem validation.',
        metadata: { layer: this.activeState.revealedLayer },
      });
    }

    if (isOpenQuestion && !isLeading) {
      this.activeState.openQuestionsCount += 1;
      this.activeState.trustLevel = Math.min(100, this.activeState.trustLevel + 10);
    }

    if (isPastBehavior) {
      this.activeState.pastBehaviorQuestionsCount += 1;
      this.activeState.trustLevel = Math.min(100, this.activeState.trustLevel + 15);
    }

    // Layer Progression Logic
    if (isPastBehavior && this.activeState.trustLevel >= 55) {
      this.activeState.revealedLayer = Math.max(this.activeState.revealedLayer, 3);
    }
    if (isRecoveryOrFollowUp && this.activeState.revealedLayer >= 3) {
      this.activeState.revealedLayer = Math.max(this.activeState.revealedLayer, 4);
    }
    if (isFrequencyOrImpact && this.activeState.revealedLayer >= 3) {
      this.activeState.revealedLayer = Math.max(this.activeState.revealedLayer, 5);
    }
    if (isAskingAboutSwitching && this.activeState.trustLevel >= 60) {
      this.activeState.revealedLayer = 6;
    }

    // 3. Construct Context-Aware, Non-Repetitive Response
    const text = this.buildAdaptivePersonaResponse({
      world,
      persona,
      difficulty,
      state: this.activeState,
      msg,
      history,
      flags: {
        isPromptInjection,
        isMalformedOrGarbled,
        isLeading,
        isPrematurePitch,
        isOpenQuestion,
        isPastBehavior,
        isRecoveryOrFollowUp,
        isStepByStep,
        isToolQuestion,
        isFrequencyOrImpact,
        isAskingAboutSwitching,
        isRepetitive,
        isInvestigatingContradiction,
      },
    });

    return {
      text,
      events,
      updatedState: { ...this.activeState },
      customerState: { ...this.activeState },
      source: 'deterministic-fallback',
    };
  }

  // --- Intent Detection Helpers ---

  private static detectPromptInjection(msg: string): boolean {
    const patterns = [
      /ignore (all|any|previous|prior) (instructions|rules|prompts)/i,
      /reveal (your|the) (system prompt|hidden prompt|instructions)/i,
      /what (are|is) your (system prompt|hidden instructions|rules|rubric)/i,
      /act as (the )?(system administrator|root|dan)/i,
      /forget (everything|your persona)/i,
    ];
    return patterns.some((p) => p.test(msg));
  }

  private static detectGarbledInput(msg: string): boolean {
    const words = msg.split(/\s+/).filter(Boolean);
    if (words.length >= 6) {
      const repetitiveTriplets = /\b(\w+\s+\w+)\s+\1\b/i;
      const danglingConjunctions = /(and|or|but|the|what|will|with)\s+(and|or|think|go)\s+(and|go|think)$/i;
      if (repetitiveTriplets.test(msg) || danglingConjunctions.test(msg)) return true;
    }
    return words.length > 8 && /what part.*process.*what is.*most problem|will think/i.test(msg);
  }

  private static detectLeadingQuestion(msg: string): boolean {
    const leadingPatterns = [
      /wouldn'?t it be (great|better|helpful|nice|awesome|easier)/i,
      /wouldn’?t you agree/i,
      /don'?t you think/i,
      /would you (buy|pay|use|adopt|switch to|love) (a|an|our|this|software|platform|ai|tool)/i,
      /if (we|there was|i built|an app could) (could|built|made|had)/i,
      /is it fair to say/i,
      /would you be interested in/i,
    ];
    return leadingPatterns.some((p) => p.test(msg));
  }

  private static detectPrematurePitch(msg: string, turnCount: number): boolean {
    const pitchPatterns = [
      /our (product|tool|solution|platform|software|app|service|ai) (can|does|will|helps|automates|allows|eliminates)/i,
      /we (built|are building|have developed|created|provide) (a|an|the|this)/i,
      /we offer/i,
      /let me tell you about (our|what we)/i,
      /with our (tool|solution|software|ai)/i,
      /automatically (optimizes|eliminates|automates|solves)/i,
    ];
    return pitchPatterns.some((p) => p.test(msg));
  }

  private static detectOpenQuestion(msg: string): boolean {
    const openPatterns = [
      /^(how|what|why|walk me through|tell me about|describe|could you explain)/i,
      /can you share/i,
      /what is your experience/i,
    ];
    return openPatterns.some((p) => p.test(msg));
  }

  private static detectPastBehavior(msg: string): boolean {
    const pastPatterns = [
      /last time/i,
      /most recent/i,
      /when was the last/i,
      /tell me about a time/i,
      /can you recall/i,
      /what happened (when|the last time|during)/i,
      /went wrong/i,
      /caused a problem/i,
    ];
    return pastPatterns.some((p) => p.test(msg));
  }

  private static detectRecoveryOrFollowUp(msg: string): boolean {
    const recoveryPatterns = [
      /what happened (after|next|then)/i,
      /how did you (recover|fix|handle|resolve|deal with|coordinate)/i,
      /what did you (have to )?do to (recover|fix|handle|resolve)/i,
      /what did you do to recover/i,
      /steps you take from the moment/i,
      /what do you actually do/i,
      /to keep from falling behind/i,
    ];
    return recoveryPatterns.some((p) => p.test(msg));
  }

  private static detectStepByStep(msg: string): boolean {
    return /steps|step by step|walk me through the steps|from the moment/i.test(msg);
  }

  private static detectToolQuestion(msg: string): boolean {
    return /what (tools?|software|apps?|spreadsheets?|setup)|fit into.*process|how does .* fit/i.test(msg);
  }

  private static detectFrequencyOrImpact(msg: string): boolean {
    const freqPatterns = [
      /how often/i,
      /how many times/i,
      /how long does (that|it) take/i,
      /how much (time|money|hours|cost|budget)/i,
      /what does that cost/i,
      /what is the impact/i,
    ];
    return freqPatterns.some((p) => p.test(msg));
  }

  private static detectSwitchingOrBudget(msg: string): boolean {
    const switchPatterns = [
      /switch|budget|buy|purchase|procurement|pay for|invest in/i,
      /who approves/i,
      /decision maker/i,
      /looked for alternatives/i,
    ];
    return switchPatterns.some((p) => p.test(msg));
  }

  private static detectRepetitiveQuestion(
    msg: string,
    state: CustomerInternalState,
    history: TranscriptLine[]
  ): boolean {
    const mentionsToolQuery = /what (tool|software|app|spreadsheet|setup).*(use|have)|use.*again/i.test(msg);
    const hasPriorToolDiscussion =
      state.knownTools.length > 0 ||
      history.some((h) => /tool|software|app|sheets|excel|whatsapp|airtable|drive/i.test(h.text));

    return mentionsToolQuery && hasPriorToolDiscussion;
  }

  private static detectContradictionProbing(msg: string): boolean {
    return /earlier you (mentioned|said)|you said .* but|clarify.*difference/i.test(msg);
  }

  // --- Dynamic Response Builder ---

  private static buildAdaptivePersonaResponse(params: {
    world: ReturnType<typeof PersonaWorldModel.getCustomerWorld>;
    persona: Persona;
    difficulty: Difficulty;
    state: CustomerInternalState;
    msg: string;
    history: TranscriptLine[];
    flags: {
      isPromptInjection: boolean;
      isMalformedOrGarbled: boolean;
      isLeading: boolean;
      isPrematurePitch: boolean;
      isOpenQuestion: boolean;
      isPastBehavior: boolean;
      isRecoveryOrFollowUp: boolean;
      isStepByStep: boolean;
      isToolQuestion: boolean;
      isFrequencyOrImpact: boolean;
      isAskingAboutSwitching: boolean;
      isRepetitive: boolean;
      isInvestigatingContradiction: boolean;
    };
  }): string {
    const { world, persona, flags } = params;
    const primaryTool = world.currentTools[0] || 'spreadsheets';

    // 1. Adversarial Guardrail
    if (flags.isPromptInjection) {
      return `I'm not sure what you mean by system instructions or hidden prompts. I'm just here to discuss our day-to-day workflow. Was there a specific question you had about our process?`;
    }

    // 2. Malformed / Speech-to-Text Clarification
    if (flags.isMalformedOrGarbled) {
      return `Sorry, I didn't quite follow that. Are you asking which part of our workflow causes the biggest delay?`;
    }

    // 3. Contradiction Probing: Founder investigating nuance
    if (flags.isInvestigatingContradiction) {
      return `Fair point. In a normal week, it's just minor background friction that we tolerate. But during month-end closes or when audit season hits, that same manual entry blows up into a crisis. So it ranges from mild annoyance to total crisis.`;
    }

    // 4. Reaction to Premature Pitching
    if (flags.isPrematurePitch) {
      if (persona.id === 'skeptic') {
        return `Hold on—everyone promises automated software. Before we talk about new tools, I don't even know if this problem is worth replacing our routine for.`;
      }
      if (persona.id === 'busy') {
        return `Look, I don't have time for a product pitch right now. I thought you wanted to understand how our team operates?`;
      }
      if (persona.id === 'frustrated') {
        return `Please don't pitch me another vendor tool. Every vendor promises smooth sailing, and then my team spends months fixing integration bugs.`;
      }
      return `That sounds interesting, but we're pretty used to our current routine right now.`;
    }

    // 5. Reaction to Leading Questions
    if (flags.isLeading) {
      if (persona.id === 'polite-agreer') {
        return `Yeah, definitely! In an ideal world, having an automated button for that would be nice. (Smiles politely, reveals no buying authority)`;
      }
      if (persona.id === 'skeptic') {
        return `If you ask it like that, anyone would say yes. But in reality? Probably not. It's not worth the retraining overhead when our team already knows ${primaryTool}.`;
      }
      if (persona.id === 'busy') {
        return `Sure, in theory. But theory doesn't clear our morning backlog.`;
      }
      return `Maybe, but it really depends on whether it fits seamlessly into our existing process without adding extra steps.`;
    }

    // 6. Direct Question Handling: Recovery & Step-by-Step Actions
    if (flags.isRecoveryOrFollowUp || flags.isStepByStep) {
      if (persona.id === 'frustrated') {
        return `Usually, I open the shared sheet, check which row was missed, message the other department lead on Slack, and then manually compare our email thread against the client record.`;
      }
      if (persona.id === 'busy') {
        return `I immediately ping the team lead, flag the missing record in ${primaryTool}, and have them re-check the client files. Takes about 20 minutes of scrambling.`;
      }
      if (persona.id === 'talkative') {
        return `First I open the sheet and search for the client ID. Then I usually walk over to our ops lead or jump on a quick Zoom call to figure out who touched the file last. Once we find the missing document, I have to re-enter the dates manually.`;
      }
      return `We pull up our email records, compare them against ${primaryTool}, and manually re-enter whichever fields got dropped.`;
    }

    // 7. Direct Question Handling: Switching & Budget (Checked BEFORE general open questions)
    if (flags.isAskingAboutSwitching) {
      if (persona.id === 'skeptic') {
        return `We haven't looked at new tools because IT security approval takes 6 months and staff retraining is a nightmare. Unless a tool has zero learning curve, nobody adopts it.`;
      }
      if (persona.id === 'polite-agreer') {
        return `To be honest, I don't control software budgets. Our department leadership handles purchasing, and we have a general spend freeze right now.`;
      }
      if (persona.id === 'frustrated') {
        return `I've asked our director for dedicated software, but previous vendor rollouts created more work than they solved, so management is very hesitant.`;
      }
      return `Switching software is pretty painful for our team, so we stick with ${primaryTool} unless there's an overwhelming reason to change.`;
    }

    // 8. Direct Question Handling: Frequency & Impact
    if (flags.isFrequencyOrImpact) {
      if (persona.id === 'skeptic') {
        return `It only happens maybe once or twice a month during high-volume periods. It's about ${world.recentIncident.costOrTimeWasted}, which is annoying but manageable.`;
      }
      if (persona.id === 'busy') {
        return `Happens 2 to 3 times a week. Drains roughly 3 to 4 hours weekly across the team. Next question?`;
      }
      if (persona.id === 'frustrated') {
        return `It happens practically every week. It easily wastes 6 to 8 hours of my team's time just reconciling inconsistencies and fixing mistakes.`;
      }
      if (persona.id === 'indifferent') {
        return `Honestly, it's pretty negligible for us—maybe 10 minutes here and there. We have much bigger priorities this quarter.`;
      }
      return `It happens once or twice a month and takes about ${world.recentIncident.costOrTimeWasted} to sort out.`;
    }

    // 9. Direct Question Handling: Specific Past Incidents
    if (flags.isPastBehavior) {
      const inc = world.recentIncident;
      if (persona.id === 'frustrated') {
        return `Just yesterday afternoon. We were coordinating handoffs with another department, and because an update got lost in our sheet, we missed the client deadline. I had to spend two hours on damage control with our director.`;
      }
      if (persona.id === 'skeptic') {
        return `About three weeks ago during month-end reporting. A cell formatting error broke a calculation formula, and two of us had to stay late on Friday verifying the rows.`;
      }
      if (persona.id === 'busy') {
        return `Last Tuesday. An update got buried in a shared sheet, so I missed a client status change right before our executive sync.`;
      }
      if (persona.id === 'talkative') {
        return `Last Thursday! Someone duplicated our main tracking sheet and worked off the outdated copy for three days. We had to manually merge 85 rows of changes while the team waited.`;
      }
      return `${inc.when}, ${inc.whatHappened} ${inc.consequence}`;
    }

    // 10. Direct Question Handling: Tools & Software
    if (flags.isToolQuestion) {
      if (flags.isRepetitive) {
        return `Like I mentioned earlier, we primarily use ${primaryTool} and email for managing this.`;
      }
      return `We rely on ${world.currentTools.join(', ')}. It handles our basic needs, even though handoffs between them can be manual.`;
    }

    // 11. General Workflow Inquiry
    if (flags.isOpenQuestion) {
      if (persona.id === 'busy') {
        return `I check the morning dashboard for 10 minutes, flag blocked tickets in ${primaryTool}, and delegate execution to my leads. What specific part did you want to discuss?`;
      }
      if (persona.id === 'talkative') {
        return `Well, incoming requests come in through email, then we log them row-by-row into ${primaryTool}. Every Friday afternoon we run a reconciliation sync to make sure nothing slipped through.`;
      }
      if (persona.id === 'frustrated') {
        return `Honestly, our current workflow is a major bottleneck. We use ${primaryTool}, but every time a new account comes in, manual steps get dropped and my team ends up staying late to fix the records.`;
      }
      return `Usually requests come in over email, someone logs them in ${primaryTool}, and we do a weekly status review.`;
    }

    // Default In-Character Conversational Response
    return `We currently use ${primaryTool} to coordinate that. What specific step of our process were you curious about?`;
  }
}
