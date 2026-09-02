import type { DiscoveryContext, Assumption, DiscoveryEvent } from '../../types/discovery';
import type { Persona } from '../../types/persona';
import type {
  Difficulty,
  Session,
  SessionDebrief,
  SessionMoment,
  MissedQuestion,
  LeadingQuestionFlag,
  PrematurePitchFlag,
  WeakAnswer,
} from '../../types/session';
import { NvidiaNimService } from './NvidiaNimService';

export class EvaluationService {
  /**
   * Performs live deep evaluation of the customer discovery interview using NVIDIA NIM LLM,
   * falling back to the structured scoring engine if offline.
   */
  static async evaluateDiscoverySessionAsync(params: {
    session: Session;
    context: DiscoveryContext;
    assumptions: Assumption[];
    persona: Persona;
    difficulty: Difficulty;
  }): Promise<SessionDebrief> {
    const baseDebrief = this.evaluateDiscoverySession(params);

    if (NvidiaNimService.isConfigured() && params.session.transcript && params.session.transcript.length > 0) {
      try {
        const llmEval = await NvidiaNimService.generateEvaluation({
          type: 'discovery',
          personaName: params.persona.name,
          difficulty: params.difficulty,
          transcript: params.session.transcript,
          context: params.context,
        });

        if (llmEval) {
          if (llmEval.overall !== undefined) baseDebrief.score.overall = Math.min(100, Math.max(20, Math.round(llmEval.overall)));
          if (llmEval.discoveryQuality !== undefined) baseDebrief.score.discoveryQuality = Math.round(llmEval.discoveryQuality);
          if (llmEval.questionQuality !== undefined) baseDebrief.score.questionQuality = Math.round(llmEval.questionQuality);
          if (llmEval.listeningQuality !== undefined) baseDebrief.score.listeningQuality = Math.round(llmEval.listeningQuality);
          if (llmEval.evidenceGathering !== undefined) baseDebrief.score.evidenceGathering = Math.round(llmEval.evidenceGathering);
          if (llmEval.summary) baseDebrief.summary = llmEval.summary;
          if (llmEval.recommendedNextStep) baseDebrief.recommendedNextStep = llmEval.recommendedNextStep;
          if (llmEval.improvements && llmEval.improvements.length > 0) baseDebrief.improvements = llmEval.improvements;
          if (llmEval.questionsToAsk && llmEval.questionsToAsk.length > 0) baseDebrief.questionsToAsk = llmEval.questionsToAsk;
          if (llmEval.strongestMoment) {
            baseDebrief.strongestMoment = {
              id: 'llm-str',
              type: 'strong',
              label: llmEval.strongestMoment.label || 'Strong Moment',
              description: llmEval.strongestMoment.description || '',
              quote: llmEval.strongestMoment.quote,
            };
            baseDebrief.strongMoments.unshift(baseDebrief.strongestMoment);
          }
          if (llmEval.weakestMoment) {
            baseDebrief.weakestMoment = {
              id: 'llm-weak',
              type: 'weak',
              label: llmEval.weakestMoment.label || 'Area for Growth',
              description: llmEval.weakestMoment.description || '',
              quote: llmEval.weakestMoment.quote,
            };
            baseDebrief.weakMoments.unshift(baseDebrief.weakestMoment);
          }
        }
      } catch (err) {
        console.warn('Live LLM evaluation failed, using base debrief:', err);
      }
    }

    return baseDebrief;
  }

  /**
   * Performs live deep evaluation of the investor pitch defense session using NVIDIA NIM LLM.
   */
  static async evaluatePitchSessionAsync(params: {
    session: Session;
    persona: Persona;
    difficulty: Difficulty;
  }): Promise<SessionDebrief> {
    const baseDebrief = this.evaluatePitchSession(params);

    if (NvidiaNimService.isConfigured() && params.session.transcript && params.session.transcript.length > 0) {
      try {
        const llmEval = await NvidiaNimService.generateEvaluation({
          type: 'pitch',
          personaName: params.persona.name,
          difficulty: params.difficulty,
          transcript: params.session.transcript,
          context: { startupName: params.session.startupName },
        });

        if (llmEval) {
          if (llmEval.overall !== undefined) baseDebrief.score.overall = Math.min(100, Math.max(20, Math.round(llmEval.overall)));
          if (llmEval.questionQuality !== undefined) baseDebrief.score.answerQuality = Math.round(llmEval.questionQuality);
          if (llmEval.discoveryQuality !== undefined) baseDebrief.score.pitchClarity = Math.round(llmEval.discoveryQuality);
          if (llmEval.summary) baseDebrief.summary = llmEval.summary;
          if (llmEval.improvements && llmEval.improvements.length > 0) baseDebrief.improvements = llmEval.improvements;
          if (llmEval.strongestMoment) {
            baseDebrief.strongMoments.unshift({
              id: 'llm-pitch-str',
              type: 'strong',
              label: llmEval.strongestMoment.label || 'Traction Command',
              description: llmEval.strongestMoment.description || '',
              quote: llmEval.strongestMoment.quote,
            });
          }
          if (llmEval.weakestMoment) {
            baseDebrief.weakMoments.unshift({
              id: 'llm-pitch-weak',
              type: 'weak',
              label: llmEval.weakestMoment.label || 'Defensibility Clarification',
              description: llmEval.weakestMoment.description || '',
              quote: llmEval.weakestMoment.quote,
            });
          }
        }
      } catch (err) {
        console.warn('Live LLM pitch evaluation failed, using base debrief:', err);
      }
    }

    return baseDebrief;
  }
  /**
   * Performs deep evaluation of the customer discovery interview,
   * calculating multi-dimensional scores and generating concrete, actionable debrief reports.
   */
  static evaluateDiscoverySession(params: {
    session: Session;
    context: DiscoveryContext;
    assumptions: Assumption[];
    persona: Persona;
    difficulty: Difficulty;
  }): SessionDebrief {
    const { session, context, assumptions, persona, difficulty } = params;
    const transcript = session.transcript || [];
    const userLines = transcript.filter((t) => t.speaker === 'user');
    const events: DiscoveryEvent[] = session.events || [];

    // Tally event signals
    const leadingEvents = events.filter((e) => e.type === 'leading_question');
    const prematurePitchEvents = events.filter((e) => e.type === 'premature_pitch');
    const openQuestionEvents = events.filter((e) => e.type === 'open_question');
    const pastBehaviorEvents = events.filter((e) => e.type === 'asked_about_past_behavior');
    const workflowEvents = events.filter((e) => e.type === 'asked_about_current_workflow');
    const impactEvents = events.filter((e) => e.type === 'asked_about_impact');
    const layerEvents = events.filter((e) => e.type === 'layer_unlocked');

    const totalQuestions = Math.max(1, userLines.length);

    // Calculate Sub-Scores (0 - 100)
    // 1. Question Quality (ratio of open questions, penalized for leading questions)
    const openRatio = openQuestionEvents.length / totalQuestions;
    const leadingRatio = leadingEvents.length / totalQuestions;
    const questionQuality = Math.min(100, Math.max(25, Math.round(openRatio * 70 + (1 - leadingRatio) * 30)));

    // 2. Evidence Gathering (asking about past behaviors, frequencies, concrete workarounds, layers unlocked)
    const maxLayer = layerEvents.length > 0 ? Math.max(...layerEvents.map((l) => (l.metadata?.layer as number) || 1)) : 1;
    const layerBonus = maxLayer * 8;
    const evidenceRatio = (pastBehaviorEvents.length + workflowEvents.length + impactEvents.length) / (totalQuestions * 1.1);
    const evidenceGathering = Math.min(100, Math.max(30, Math.round(evidenceRatio * 70 + layerBonus + 15)));

    // 3. Listening & Empathy (handling persona resistance, avoiding pitch)
    const pitchPenalty = prematurePitchEvents.length * 20;
    const listeningQuality = Math.min(100, Math.max(25, Math.round(85 - pitchPenalty + (pastBehaviorEvents.length > 0 ? 10 : 0))));

    // 4. Discovery Quality (composite methodology score)
    const discoveryQuality = Math.round(questionQuality * 0.35 + evidenceGathering * 0.4 + listeningQuality * 0.25);

    // 5. Goal Coverage (how many assumptions were probed)
    const selectedAssumptions = assumptions.filter((a) => a.selected);
    const assumptionTarget = Math.max(1, selectedAssumptions.length);
    const coveredCount = Math.min(
      assumptionTarget,
      Math.floor(userLines.length / 2) + (workflowEvents.length > 0 ? 1 : 0) + (impactEvents.length > 0 ? 1 : 0)
    );
    const goalCoverage = Math.min(100, Math.round((coveredCount / assumptionTarget) * 90 + 10));

    // 6. Overall Readiness Score
    let overall = Math.round(
      discoveryQuality * 0.35 + questionQuality * 0.25 + listeningQuality * 0.20 + evidenceGathering * 0.20
    );

    if (difficulty === 'hard' && overall > 50) {
      overall = Math.min(96, overall + 4);
    }

    const strongMoments: SessionMoment[] = [];
    const weakMoments: SessionMoment[] = [];
    const missedQuestions: MissedQuestion[] = [];
    const leadingQuestionFlags: LeadingQuestionFlag[] = [];
    const prematurePitchFlags: PrematurePitchFlag[] = [];
    const improvements: string[] = [];
    const questionsToAsk: string[] = [];

    // Evaluate Strengths
    if (pastBehaviorEvents.length > 0) {
      const quote = pastBehaviorEvents[0].quote || userLines[0]?.text;
      strongMoments.push({
        id: 'str-past',
        type: 'strong',
        label: 'Investigated Real Past Behavior',
        description: 'You asked the customer to recall actual historical experiences rather than hypothetical future promises.',
        quote,
      });
    }

    if (workflowEvents.length > 0) {
      const quote = workflowEvents[0].quote || userLines[0]?.text;
      strongMoments.push({
        id: 'str-work',
        type: 'strong',
        label: 'Probed Current Workflow Baseline',
        description: 'You explored how the customer currently solves the problem before assuming a new tool is needed.',
        quote,
      });
    }

    if (maxLayer >= 4) {
      strongMoments.push({
        id: 'str-depth',
        type: 'strong',
        label: `Deep Discovery Depth (Layer ${maxLayer}/6)`,
        description: 'Your persistent questioning uncovered concrete consequences and switching realities.',
      });
    }

    if (strongMoments.length === 0) {
      strongMoments.push({
        id: 'str-engage',
        type: 'strong',
        label: 'Initiated Customer Engagement',
        description: 'You completed a multi-turn discovery interview with an authentic customer persona.',
      });
    }

    // Evaluate Weaknesses & Leading Questions
    if (leadingEvents.length > 0) {
      leadingEvents.forEach((evt, idx) => {
        leadingQuestionFlags.push({
          id: `lead-flag-${idx}`,
          founderQuote: evt.quote || 'Would you use a tool for this?',
          issue: 'Leading question: Nudges the customer to agree politely without revealing actual behavioral urgency.',
          betterAlternative: 'Ask: "Walk me through the last time you ran into this problem, and what steps you took."',
        });
      });

      weakMoments.push({
        id: 'wk-lead',
        type: 'weak',
        label: 'Leading Question Detected',
        description: `You asked ${leadingEvents.length} leading question(s) that framed a positive answer for the customer.`,
        quote: leadingEvents[0].quote,
      });

      improvements.push('Replace hypothetical questions like "Would you use..." with past-tense inquiries like "Tell me about the last time you..."');
    }

    // Evaluate Premature Pitching
    if (prematurePitchEvents.length > 0) {
      prematurePitchEvents.forEach((evt, idx) => {
        prematurePitchFlags.push({
          id: `pitch-flag-${idx}`,
          founderQuote: evt.quote || 'Our platform automates this completely...',
          context: 'Customer discovery interview',
          reason: 'You pitched features before uncovering whether the customer perceives this as an acute priority.',
        });
      });

      weakMoments.push({
        id: 'wk-pitch',
        type: 'weak',
        label: 'Premature Solution Pitching',
        description: 'You introduced your product solution before establishing whether the customer experiences severe friction.',
        quote: prematurePitchEvents[0].quote,
      });

      improvements.push('Resist the urge to pitch your solution during discovery. Treat this purely as research to understand their baseline.');
    }

    // Missed Opportunities & Persona-Specific Feedback
    if (persona.id === 'polite-agreer') {
      missedQuestions.push({
        id: 'mq-polite',
        customerStatement: '"That sounds really great! I would definitely check that out."',
        question: 'When did you last spend money or dedicated time trying to solve this?',
        why: 'Polite customers say yes easily. You must test for skin-in-the-game to separate politeness from real demand.',
      });
      improvements.push('When facing a Polite Agree-er, discount compliments and ask for evidence of budget, tools purchased, or past attempts to switch.');
    } else if (persona.id === 'skeptic') {
      missedQuestions.push({
        id: 'mq-skeptic',
        customerStatement: '"Why does this even matter? We just deal with it in our spreadsheet."',
        question: 'What is the downstream consequence if a mistake happens in that spreadsheet?',
        why: 'Skeptics challenge the premise. Ask about catastrophic edge cases rather than debating them.',
      });
      improvements.push('Never debate a Skeptic. Ask them to quantify what happens when their current workaround fails.');
    } else if (persona.id === 'busy') {
      missedQuestions.push({
        id: 'mq-busy',
        customerStatement: '"I only have a couple minutes, what do you need?"',
        question: 'What is the single most tedious 30 minutes of your workday this week?',
        why: 'Busy customers need ultra-specific, high-leverage prompts that immediately spark a visceral response.',
      });
      improvements.push('Keep questions under 15 words for time-pressured customers.');
    } else {
      missedQuestions.push({
        id: 'mq-gen',
        customerStatement: 'Discussion of operational workflow',
        question: 'Walk me through the last time this created a delay or cost you money.',
        why: 'Connecting the problem to a measurable past event reveals true severity.',
      });
    }

    // Recommended Questions to Try Next Time
    questionsToAsk.push(
      'Walk me through the exact steps you took the last time this problem occurred.',
      'What workarounds or tools have you tried in the past, and why did they fall short?',
      'Who in your organization feels the most pain when this goes wrong?'
    );

    // Strongest & Weakest Moments
    const strongestMoment: SessionMoment = strongMoments[0] || {
      id: 'sm-default',
      type: 'strong',
      label: 'Constructive Dialogue',
      description: 'You maintained professional focus throughout the customer interview.',
    };

    const weakestMoment: SessionMoment = weakMoments[0] || {
      id: 'wm-default',
      type: 'weak',
      label: 'Deepen Follow-up Inquiries',
      description: 'You could have probed further into the financial impact of the customer\'s workflow.',
    };

    // Recommended Next Step
    let recommendedNextStep = 'In your next practice session, focus on asking for specific stories from the past week before mentioning any technology.';
    if (leadingEvents.length > 0) {
      recommendedNextStep = 'Practice keeping all initial questions open-ended without suggesting any specific product features.';
    } else if (prematurePitchEvents.length > 0) {
      recommendedNextStep = 'Focus on understanding why the customer\'s current toolstack has survived before explaining why your solution is better.';
    }

    // Executive Summary
    let summary = `You completed a ${difficulty} discovery interview with ${persona.name}. You explored their workflow and uncovered valuable signals, with opportunities to sharpen question neutrality and eliminate premature pitching.`;
    if (overall >= 80) {
      summary = `Outstanding customer discovery session with ${persona.name}. You asked open-ended questions, dug into past behavior, and avoided the temptation to sell. Your discovery instincts are well calibrated.`;
    } else if (overall < 60) {
      summary = `Valuable practice session with ${persona.name}. You identified key workflow areas, but leading questions and early solution pitching weakened the evidentiary quality of the conversation. Focus on listening and past-behavior probing in your next run.`;
    }

    return {
      score: {
        overall,
        discoveryQuality,
        questionQuality,
        listeningQuality,
        followUpQuality: Math.round((listeningQuality + evidenceGathering) / 2),
        evidenceGathering,
        goalCoverage,
        leadingQuestions: leadingEvents.length,
        prematurePitching: prematurePitchEvents.length,
      },
      strongMoments,
      weakMoments,
      missedQuestions,
      leadingQuestionFlags,
      prematurePitchFlags,
      improvements: improvements.length > 0 ? improvements : ['Continue practicing with skeptical and polite customer personas to stress-test your question discipline.'],
      questionsToAsk,
      strongestMoment,
      weakestMoment,
      recommendedNextStep,
      summary,
      disclaimer: 'Scores reflect performance in this simulated practice session and should be interpreted as session-specific coaching signals, not definitive measurements of founder capability.',
      validationReminder: 'Simulation outcomes should not be treated as customer validation. Use real customer conversations to validate these assumptions.',
    };
  }

  /**
   * Performs deep evaluation of the investor pitch defense session,
   * scoring answer precision, financial command, defensibility, and objection handling.
   */
  static evaluatePitchSession(params: {
    session: Session;
    persona: Persona;
    difficulty: Difficulty;
  }): SessionDebrief {
    const { session, persona, difficulty } = params;
    const transcript = session.transcript || [];
    const userLines = transcript.filter((t) => t.speaker === 'user');

    const totalTurns = Math.max(1, userLines.length);
    const wordCounts = userLines.map((l) => l.text.trim().split(/\s+/).length);
    const avgWordCount = Math.round(wordCounts.reduce((a, b) => a + b, 0) / totalTurns);

    // Evaluate Metric Specificity
    const numberMentions = userLines.filter((l) => /\b\d+(k|m|%)?|\$|₹|lakh|crore|arr|mrr|users|customers\b/i.test(l.text)).length;
    const numberRatio = numberMentions / totalTurns;

    // Evaluate Defensibility & Unit Economics Command
    const unitEconomicsMentions = userLines.filter((l) => /cac|ltv|payback|unit economics|gross margin|retention|churn|moat/i.test(l.text)).length;
    const unitEconomicsRatio = unitEconomicsMentions / totalTurns;

    // Sub-Scores
    const pitchClarity = Math.min(96, Math.max(35, Math.round(70 + (avgWordCount >= 15 && avgWordCount <= 60 ? 15 : -10) + numberRatio * 15)));
    const answerQuality = Math.min(95, Math.max(30, Math.round(55 + numberRatio * 25 + unitEconomicsRatio * 20)));
    const businessUnderstanding = Math.min(94, Math.max(35, Math.round(60 + unitEconomicsRatio * 35)));
    const marketUnderstanding = Math.min(92, Math.max(40, Math.round(65 + numberRatio * 25)));
    const tractionUnderstanding = Math.min(95, Math.max(30, Math.round(50 + numberRatio * 45)));
    const objectionHandling = Math.min(90, Math.max(35, Math.round(60 + (totalTurns >= 3 ? 15 : -5) + (difficulty === 'hard' ? 10 : 0))));
    const conciseness = avgWordCount <= 45 ? 88 : avgWordCount <= 75 ? 70 : 50;

    const overall = Math.round(
      pitchClarity * 0.25 + answerQuality * 0.25 + businessUnderstanding * 0.20 + tractionUnderstanding * 0.15 + objectionHandling * 0.15
    );

    const strongMoments: SessionMoment[] = [];
    const weakMoments: SessionMoment[] = [];
    const weakAnswers: WeakAnswer[] = [];
    const redFlags: string[] = [];
    const unansweredQuestions: string[] = [];
    const improvements: string[] = [];

    if (numberMentions > 0) {
      strongMoments.push({
        id: 'str-num',
        type: 'strong',
        label: 'Grounded Answers with Metrics',
        description: 'You cited concrete numbers and quantitative milestones instead of relying entirely on vague qualitative claims.',
        quote: userLines.find((l) => /\d+/.test(l.text))?.text,
      });
    }

    if (avgWordCount >= 15 && avgWordCount <= 55) {
      strongMoments.push({
        id: 'str-concise',
        type: 'strong',
        label: 'Disciplined Answer Length',
        description: 'You kept answers concise and punchy without getting bogged down in defensive monologues.',
      });
    }

    if (strongMoments.length === 0) {
      strongMoments.push({
        id: 'str-def',
        type: 'strong',
        label: 'Engaged in High-Stakes Defense',
        description: 'You navigated partner-level investor questioning with poise.',
      });
    }

    if (numberRatio < 0.4) {
      weakMoments.push({
        id: 'wk-vague',
        type: 'weak',
        label: 'Abstract Claims Lacking Data',
        description: 'Several answers relied on top-down adjectives ("huge market", "great growth") without concrete bottom-up proof.',
        quote: userLines[0]?.text,
      });
      weakAnswers.push({
        id: 'wa-1',
        investorQuestion: 'What are your current customer acquisition costs and payback periods?',
        founderAnswer: userLines[1]?.text || 'We are growing mostly through word of mouth right now.',
        feedback: 'Investors look for specific payback months even when early acquisition is organic.',
      });
      redFlags.push('Did not specify bottom-up customer pricing calculations.');
      improvements.push('Lead with bottom-up numbers (Price × Target Accounts) rather than broad industry reports.');
    }

    if (unitEconomicsRatio < 0.3) {
      improvements.push('Quantify gross margin percentages and CAC payback periods upfront when explaining business models.');
    }

    const summary =
      overall >= 80
        ? `Impressive pitch defense against ${persona.name}. You defended your unit economics, cited concrete traction metrics, and handled pushback with authority.`
        : `Constructive pitch defense against ${persona.name}. You established your core product narrative, with opportunities to sharpen quantitative precision on CAC payback and competitive moats.`;

    return {
      score: {
        overall,
        pitchClarity,
        answerQuality,
        businessUnderstanding,
        marketUnderstanding,
        tractionUnderstanding,
        objectionHandling,
        confidence: 80,
        conciseness,
      },
      strongMoments,
      weakMoments,
      weakAnswers,
      redFlags,
      unansweredQuestions,
      improvements: improvements.length > 0 ? improvements : ['Continue practicing with skeptical VC personas to refine your pricing power defense.'],
      summary,
      disclaimer: 'Scores reflect performance in this simulated practice session and should be interpreted as session-specific coaching signals, not definitive measurements of founder capability.',
      validationReminder: 'Investor reactions are simulated for rehearsal and should not be interpreted as evidence of actual funding interest or investment intent. Validate metrics and pitch narrative with real investors.',
    };
  }
}
