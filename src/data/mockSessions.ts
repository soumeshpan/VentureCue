import type { Session } from '../types/session';

export const mockSessions: Session[] = [
  {
    id: 'sess-001',
    type: 'discovery',
    personaId: 'skeptic',
    personaName: 'The Skeptic',
    difficulty: 'moderate',
    startedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    endedAt: Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 22,
    durationSeconds: 22 * 60,
    startupName: 'InvoiceFlow',
    transcript: [
      {
        id: 't1',
        speaker: 'avatar',
        text: "Hi, I'm Sarah. I manage finances for a small design agency. What did you want to talk about?",
        timestamp: 0,
      },
      {
        id: 't2',
        speaker: 'user',
        text: "Thanks for your time. I'm working on a product that helps freelancers with invoicing. Do you find invoicing takes a lot of your time?",
        timestamp: 5000,
      },
      {
        id: 't3',
        speaker: 'avatar',
        text: "I mean, it takes some time. But I already use QuickBooks. Why would I need something else?",
        timestamp: 12000,
      },
    ],
    debrief: {
      score: {
        overall: 62,
        discoveryQuality: 58,
        questionQuality: 55,
        listeningQuality: 70,
        followUpQuality: 60,
        leadingQuestions: 35,
        prematurePitching: 40,
      },
      strongMoments: [
        {
          id: 'sm1',
          type: 'strong',
          label: 'Good active listening',
          description: "You acknowledged the customer's existing solution before responding.",
          quote: "I see, so you're already using QuickBooks.",
        },
      ],
      weakMoments: [
        {
          id: 'wm1',
          type: 'weak',
          label: 'Leading question detected',
          description: 'Your opening question assumed invoicing is a pain point rather than asking openly about their workflow.',
          quote: 'Do you find invoicing takes a lot of your time?',
        },
        {
          id: 'wm2',
          type: 'weak',
          label: 'Premature feature mention',
          description: 'You mentioned your product too early before establishing genuine pain.',
        },
      ],
      missedQuestions: [
        {
          id: 'mq1',
          question: "Can you walk me through what happens after you finish a project with a client?",
          why: "Open-ended workflow question that would reveal actual friction without suggesting a problem.",
        },
        {
          id: 'mq2',
          question: "When was the last time invoicing caused you a headache? What happened?",
          why: "Past-behavior question that surfaces real evidence rather than hypothetical opinions.",
        },
      ],
      improvements: [
        "Start with open workflow questions — never assume the problem in your opening question.",
        "Delay mentioning your product until you have confirmed the problem exists.",
        "When they mention an existing solution, explore what's missing from it before comparing.",
      ],
      questionsToAsk: [
        "Walk me through a typical week — what does your billing and admin time look like?",
        "What tools do you currently use for invoicing? What do you like and dislike about them?",
        "Has a payment ever been delayed or disputed? What happened?",
      ],
      summary:
        "Good listening but leading questions and early product mention undermined the session. Focus on open-ended workflow exploration.",
    },
  },
  {
    id: 'sess-002',
    type: 'pitch',
    personaId: 'numbers-focused',
    personaName: 'Numbers-Focused Investor',
    difficulty: 'hard',
    startedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    endedAt: Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 18,
    durationSeconds: 18 * 60,
    startupName: 'InvoiceFlow',
    pitchTitle: 'InvoiceFlow Series A Pitch',
    transcript: [
      {
        id: 'p1',
        speaker: 'avatar',
        text: "Okay, you mentioned you have 10,000 potential users. How many are actually paying today?",
        timestamp: 0,
      },
      {
        id: 'p2',
        speaker: 'user',
        text: "We're in beta with about 200 active users right now.",
        timestamp: 8000,
      },
      {
        id: 'p3',
        speaker: 'avatar',
        text: "Active means what exactly? Logged in once? Using it weekly? And what's the conversion rate from free to paid?",
        timestamp: 15000,
      },
    ],
    debrief: {
      score: {
        overall: 71,
        pitchClarity: 75,
        answerQuality: 68,
        businessUnderstanding: 80,
        marketUnderstanding: 70,
        tractionUnderstanding: 60,
        competitiveUnderstanding: 72,
        objectionHandling: 65,
        confidence: 78,
        conciseness: 74,
        consistency: 76,
      },
      strongMoments: [
        {
          id: 'sm1',
          type: 'strong',
          label: 'Strong business model clarity',
          description: 'You explained the revenue model concisely with specific numbers.',
        },
        {
          id: 'sm2',
          type: 'strong',
          label: 'Good competitive awareness',
          description: 'You named direct competitors and articulated a clear differentiation.',
        },
      ],
      weakMoments: [
        {
          id: 'wm1',
          type: 'weak',
          label: 'Traction definition vague',
          description: '"Active users" was not defined — the investor immediately challenged this.',
        },
        {
          id: 'wm2',
          type: 'weak',
          label: 'Objection handling weak',
          description: 'When pressed on conversion rate, you deflected rather than answering directly.',
        },
      ],
      weakAnswers: [
        {
          id: 'wa1',
          investorQuestion: "What's your monthly burn and runway?",
          founderAnswer: "We're capital efficient and runway isn't an immediate concern.",
          feedback: "This non-answer will lose investor trust immediately. Always know your exact burn and runway.",
        },
      ],
      redFlags: [
        "Vague traction definition — needs precise metrics",
        "Avoided direct answer on burn rate",
      ],
      unansweredQuestions: [
        "What is your exact monthly burn rate?",
        "What is the conversion rate from free to paid?",
        "What is your customer acquisition cost?",
      ],
      improvements: [
        "Always define what 'active' means before using the term with investors.",
        "Know your burn rate, runway, and conversion metrics by heart — these are non-negotiable.",
        "When you don't know an answer, acknowledge it confidently and commit to following up.",
      ],
      summary:
        "Strong fundamentals but precision gaps on metrics undermined credibility. Practice tight metric answers.",
    },
  },
  {
    id: 'sess-003',
    type: 'discovery',
    personaId: 'talkative',
    personaName: 'The Talkative Customer',
    difficulty: 'easy',
    startedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    endedAt: Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 28,
    durationSeconds: 28 * 60,
    startupName: 'InvoiceFlow',
    transcript: [],
    debrief: {
      score: {
        overall: 78,
        discoveryQuality: 80,
        questionQuality: 76,
        listeningQuality: 82,
        followUpQuality: 75,
        leadingQuestions: 15,
        prematurePitching: 10,
      },
      strongMoments: [
        {
          id: 'sm1',
          type: 'strong',
          label: 'Excellent follow-up on workflow',
          description: 'You asked great follow-up questions when the customer mentioned their monthly reconciliation process.',
        },
        {
          id: 'sm2',
          type: 'strong',
          label: 'Redirected effectively',
          description: 'When the customer went off-topic, you steered back without being rude.',
        },
      ],
      weakMoments: [
        {
          id: 'wm1',
          type: 'weak',
          label: 'Missed payment dispute signal',
          description: 'The customer mentioned a late payment dispute briefly — you moved on without exploring it.',
        },
      ],
      missedQuestions: [
        {
          id: 'mq1',
          question: "You mentioned a late payment dispute — can you tell me more about what happened there?",
          why: "This was a high-signal moment that indicated real pain. Always investigate brief mentions of problems.",
        },
      ],
      improvements: [
        "When a customer briefly mentions a problem, stop and explore it immediately — these are golden signals.",
        "Consider asking 'Can you say more about that?' whenever something interesting surfaces.",
      ],
      questionsToAsk: [
        "Tell me about a time a payment didn't go smoothly. What happened?",
        "If you could fix one thing about your current billing process, what would it be?",
      ],
      summary:
        "Strong session overall. One missed signal on the payment dispute. Great follow-up and redirection.",
    },
  },
];
