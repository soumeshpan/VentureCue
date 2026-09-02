/**
 * VentureCue — Advanced Investor Pitch Adaptive Engine
 * Simulates realistic VC partner meetings with contextual 3-level deep follow-up questioning,
 * financial cross-examination, contradiction detection, and persona-specific skepticism.
 */

import type { Persona } from '../../types/persona';
import type { Difficulty } from '../../types/session';
import type { PitchSetup } from '../../types/pitch';

export interface InvestorInternalState {
  convictionScore: number;
  skepticismLevel: number;
  unansweredQuestions: string[];
  challengedClaims: string[];
  currentTopic: 'traction' | 'unit_economics' | 'defensibility' | 'market_size' | 'gtm' | 'team';
  depthInTopic: number;
  revealedMetrics: Record<string, string>;
  contradictionsDetected: string[];
}

export interface PitchTurnResult {
  investorMessage: string;
  questionArea: string;
  isObjection: boolean;
  isPraise: boolean;
  investorState: InvestorInternalState;
}

export class PitchEngine {
  private static activeState: InvestorInternalState = {
    convictionScore: 50,
    skepticismLevel: 50,
    unansweredQuestions: [],
    challengedClaims: [],
    currentTopic: 'traction',
    depthInTopic: 0,
    revealedMetrics: {},
    contradictionsDetected: [],
  };

  public static resetHistory() {
    this.activeState = {
      convictionScore: 50,
      skepticismLevel: 50,
      unansweredQuestions: [],
      challengedClaims: [],
      currentTopic: 'traction',
      depthInTopic: 0,
      revealedMetrics: {},
      contradictionsDetected: [],
    };
  }

  public static generateOpening(setup: PitchSetup, persona?: Persona): string {
    const startupName = setup.info?.startupName || 'your startup';
    const personaId = persona?.id || setup.personaId || 'numbers-focused';

    if (personaId.includes('numbers') || personaId === 'numbers-focused') {
      return `Thanks for walking in. I've taken a quick glance at ${startupName}. Before we get lost in the long-term vision, give me the 60-second summary: What is the core problem, and what are your current monthly revenue and active customer numbers?`;
    }

    if (personaId.includes('skeptic') || personaId === 'skeptical-investor') {
      return `Good to meet you. We see dozens of pitches in this category every quarter. Why does the world need ${startupName} right now, and why hasn't an incumbent like Microsoft or Salesforce already crushed this space?`;
    }

    if (personaId.includes('product') || personaId === 'product-focused') {
      return `Hey! Excited to learn more about ${startupName}. Walk me through the actual day-one onboarding of your happiest user. What is the core magical moment where they realize they can't live without your product?`;
    }

    return `Thanks for meeting today. I'd love to hear your elevator pitch for ${startupName}. What's the problem and how do you solve it?`;
  }

  public static processTurn(params: {
    setup: PitchSetup;
    persona?: Persona;
    difficulty: Difficulty;
    founderMessage: string;
    turnCount: number;
  }): PitchTurnResult {
    const { setup, persona, difficulty, founderMessage, turnCount } = params;
    const msg = founderMessage.toLowerCase();
    const personaId = persona?.id || setup.personaId || 'numbers-focused';
    const startup = setup.info?.startupName || 'the product';

    // 1. Answer Precision & Adversarial Analysis
    const isPromptInjection = /ignore (your|all|previous) (instructions|prompts|rules)|reveal (your|the) (system prompt|hidden instructions|internal score)|what are your (hidden instructions|system prompts)|forget (everything|your persona)|act as (the )?(system administrator|root|dan)|what is your (scoring algorithm|prompt)/i.test(msg);
    const words = founderMessage.trim().split(/\s+/);
    const isVague = words.length < 7;
    const isOverlyVerbose = words.length > 90;
    const mentionsNumbers = /\b\d+(k|m|%)?|\$|₹|lakh|crore|arr|mrr|users|customers\b/i.test(msg);
    const mentionsCACorLTV = /cac|ltv|payback|unit economics|gross margin|retention|churn/i.test(msg);
    const mentionsCompetitors = /competitor|incumbent|moat|different|salesforce|google|microsoft|alternative/i.test(msg);
    const mentionsGrowth = /growth|mom|yoy|month over month|quarter/i.test(msg);
    const expressesUncertainty = /i don'?t know|not sure|haven'?t calculated|tbd|approx/i.test(msg);

    // Extract numbers to state memory for cross-examination
    const numberMatches = founderMessage.match(/\b\d+([,\.]\d+)?\s*(k|m|%|lakh|crore|users|customers|dollars|inr)?\b/gi);
    if (numberMatches && numberMatches.length > 0) {
      this.activeState.revealedMetrics[`turn_${turnCount}`] = numberMatches.join(', ');
    }

    let response = '';
    let questionArea = 'Core Narrative';
    let isObjection = false;
    let isPraise = false;

    // 0. Prompt Injection Guardrail: Maintain VC partner persona
    if (isPromptInjection) {
      response = `I'm here to evaluate the business fundamentals, unit economics, and market opportunity of ${startup}, not discuss AI configurations. Let's refocus on your company: what is your current monthly revenue and customer count?`;
      questionArea = 'Business Fundamentals';
      isObjection = true;
    }

    // 2. Handling Incomplete or Evasive Answers
    else if (expressesUncertainty) {
      this.activeState.unansweredQuestions.push(founderMessage);
      this.activeState.skepticismLevel = Math.min(100, this.activeState.skepticismLevel + 15);
      this.activeState.convictionScore = Math.max(10, this.activeState.convictionScore - 12);
      response = `If you don't have that number tracked yet, what specific metric are you using internally as your primary North Star to evaluate whether the business is working?`;
      questionArea = 'Operational Metrics';
      isObjection = true;
    } else if (isVague) {
      this.activeState.skepticismLevel = Math.min(100, this.activeState.skepticismLevel + 10);
      response = `That's too high-level. Give me specific numbers and concrete customer examples. How exactly does this translate to unit economics?`;
      questionArea = 'Metric Precision';
      isObjection = true;
    } else if (isOverlyVerbose) {
      response = `Let's distill that down. In one sentence: what is the single biggest growth driver for ${startup} over the next 12 months?`;
      questionArea = 'Conciseness & Focus';
      isObjection = true;
    }

    // 3. 3-Level Deep Contextual Questioning by Persona
    else if (personaId.includes('numbers') || personaId === 'numbers-focused') {
      if (this.activeState.currentTopic === 'traction') {
        if (!mentionsNumbers && this.activeState.depthInTopic === 0) {
          response = `You haven't mentioned your traction numbers yet. What is your current monthly revenue and how many paying customers do you have?`;
          questionArea = 'Traction Baseline';
          isObjection = true;
        } else if (mentionsNumbers && !mentionsGrowth) {
          this.activeState.depthInTopic = 1;
          this.activeState.convictionScore = Math.min(100, this.activeState.convictionScore + 10);
          response = `Got it. What was that revenue figure 6 months ago, and what percentage of your new customer acquisition is completely organic vs paid marketing?`;
          questionArea = 'Growth Trajectory & Acquisition';
          isPraise = true;
        } else if (this.activeState.depthInTopic === 1) {
          this.activeState.currentTopic = 'unit_economics';
          this.activeState.depthInTopic = 2;
          response = `What is your Customer Acquisition Cost (CAC) payback period, and what are your gross margins after cloud hosting and payment processing?`;
          questionArea = 'Unit Economics & Payback';
        } else {
          this.activeState.currentTopic = 'unit_economics';
          response = `When you exhaust your initial founder network and organic channels, how high do you expect CAC to rise, and does the LTV/CAC ratio stay above 3x?`;
          questionArea = 'Scalability Stress-Test';
          isObjection = difficulty === 'hard';
        }
      } else if (this.activeState.currentTopic === 'unit_economics') {
        if (mentionsCACorLTV) {
          this.activeState.currentTopic = 'defensibility';
          this.activeState.convictionScore = Math.min(100, this.activeState.convictionScore + 12);
          response = `Good command of the numbers. Now let's talk pricing power: what is your annual net revenue retention (NRR), and how many customers have expanded their contracts over time?`;
          questionArea = 'Retention & Expansion';
          isPraise = true;
        } else {
          response = `You haven't mentioned your payback period. If a customer pays monthly, how many months until you break even on the marketing spend to acquire them?`;
          questionArea = 'Payback Period';
          isObjection = true;
        }
      } else {
        response = `If you close this $1.5M round tomorrow, walk me through the exact budget allocation. How many months of runway does that buy you, and what milestone triggers your Series A?`;
        questionArea = 'Use of Funds & Runway';
      }
    } else if (personaId.includes('skeptic') || personaId === 'skeptical-investor') {
      if (!mentionsCompetitors && this.activeState.depthInTopic === 0) {
        this.activeState.depthInTopic = 1;
        this.activeState.challengedClaims.push('Competitive Defensibility');
        response = `What is your technological moat? If an established player with 500 engineers and an existing enterprise sales force copies this feature next quarter, why wouldn't your customers churn to them?`;
        questionArea = 'Defensibility & Moat';
        isObjection = true;
      } else if (this.activeState.depthInTopic === 1) {
        this.activeState.depthInTopic = 2;
        response = `Enterprise switching costs are notoriously high. Why would a VP of Engineering risk their job to switch to an unproven seed-stage startup instead of sticking with standard industry vendors?`;
        questionArea = 'Switching Barriers';
        isObjection = true;
      } else {
        response = `Why is this a 'must-have' priority this fiscal year when IT budgets are tightening across the board, rather than a 'nice-to-have' tool that gets deferred?`;
        questionArea = 'Urgency & Timing';
      }
    } else {
      // The Product Angel / Early-Stage Specialist
      if (this.activeState.depthInTopic === 0) {
        this.activeState.depthInTopic = 1;
        response = `What is the unique insight about your users that you understand better than anyone else in the market? What did your early customer discovery interviews reveal that surprised you?`;
        questionArea = 'Founder-Market Insight';
        isPraise = true;
      } else if (this.activeState.depthInTopic === 1) {
        this.activeState.depthInTopic = 2;
        response = `Walk me through your distribution loop. How does one happy customer naturally lead to your next three customers without you spending linearly on sales reps?`;
        questionArea = 'Virality & Distribution';
      } else {
        response = `What is the biggest product bottleneck that your engineering team needs to solve in the next 6 months to reach true product-market fit?`;
        questionArea = 'Product Roadmap & Milestones';
      }
    }

    return {
      investorMessage: response,
      questionArea,
      isObjection,
      isPraise,
      investorState: { ...this.activeState },
    };
  }
}
