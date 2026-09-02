import type { Persona } from '../types/persona';

export const customerPersonas: Persona[] = [
  {
    id: 'skeptic',
    category: 'customer',
    name: 'The Skeptic',
    tagline: 'Challenges everything — including your assumptions.',
    description:
      'This customer questions the premise of your product, asks why the problem matters, and won\'t accept vague answers. They need concrete evidence before acknowledging a problem exists.',
    behaviorCues: [
      'Questions the significance of the problem',
      'Asks "why does that matter?" repeatedly',
      'Challenges assumptions directly',
      'Requires evidence before agreeing',
      'Won\'t fill in gaps for the founder',
    ],
    traits: [
      { label: 'Challenging', description: 'Pushes back on every claim' },
      { label: 'Analytical', description: 'Wants data and specifics' },
      { label: 'Direct', description: 'Says exactly what they think' },
    ],
    difficulty: 'hard',
    icon: 'ShieldQuestion',
  },
  {
    id: 'busy',
    category: 'customer',
    name: 'The Busy Customer',
    tagline: 'Short answers. No time to elaborate.',
    description:
      'This customer is time-pressured and gives brief, surface-level answers. They won\'t volunteer information. The founder must ask precise, targeted questions to extract useful data.',
    behaviorCues: [
      'Gives one or two word answers',
      'Frequently mentions being busy',
      'Doesn\'t elaborate unless specifically prompted',
      'May try to end the conversation early',
      'Short attention span for abstract questions',
    ],
    traits: [
      { label: 'Brief', description: 'Minimal responses' },
      { label: 'Impatient', description: 'Values their time highly' },
      { label: 'Selective', description: 'Only engages with direct questions' },
    ],
    difficulty: 'moderate',
    icon: 'Timer',
  },
  {
    id: 'talkative',
    category: 'customer',
    name: 'The Talkative Customer',
    tagline: 'Tells you everything — including things you didn\'t ask.',
    description:
      'This customer loves talking and will go on long tangents. They provide rich context but require the founder to actively steer the conversation and separate signal from noise.',
    behaviorCues: [
      'Gives long, detailed answers',
      'Frequently goes off-topic',
      'Shares related stories and anecdotes',
      'Hard to interrupt politely',
      'Provides lots of data — some relevant, some not',
    ],
    traits: [
      { label: 'Verbose', description: 'Long, detailed responses' },
      { label: 'Enthusiastic', description: 'Genuinely likes talking' },
      { label: 'Tangential', description: 'Easily distracted from the topic' },
    ],
    difficulty: 'moderate',
    icon: 'MessageSquare',
  },
  {
    id: 'polite-agreer',
    category: 'customer',
    name: 'The Polite Agree-er',
    tagline: 'Says yes to everything. Means almost nothing.',
    description:
      'This customer is friendly and agreeable but provides little evidence the problem truly matters to them. They\'re the classic false positive — dangerous for founders who mistake politeness for validation.',
    behaviorCues: [
      'Agrees with most statements',
      'Avoids conflict or negativity',
      'Gives encouraging but vague answers',
      'Rarely reveals actual behavior or priorities',
      'Responds positively to leading questions',
    ],
    traits: [
      { label: 'Agreeable', description: 'Rarely says no or challenges' },
      { label: 'Vague', description: 'Answers lack specifics' },
      { label: 'Friendly', description: 'Warm, encouraging tone' },
    ],
    difficulty: 'hard',
    icon: 'Smile',
  },
  {
    id: 'frustrated',
    category: 'customer',
    name: 'The Frustrated Customer',
    tagline: 'Has a real problem. Not happy about it.',
    description:
      'This customer genuinely experiences the problem but is impatient, emotional, and difficult to keep on topic. Rich discovery potential — but requires the founder to handle frustration without being defensive.',
    behaviorCues: [
      'Expresses frustration with the current situation',
      'Can be blunt or abrupt',
      'Gives emotional responses, not just logical ones',
      'Has specific complaints if drawn out',
      'May disengage if they feel they\'re being sold to',
    ],
    traits: [
      { label: 'Frustrated', description: 'Visibly annoyed with status quo' },
      { label: 'Direct', description: 'Says what they think, sometimes harshly' },
      { label: 'Impatient', description: 'Low tolerance for unclear questions' },
    ],
    difficulty: 'hard',
    icon: 'Zap',
  },
  {
    id: 'indifferent',
    category: 'customer',
    name: 'The Indifferent Customer',
    tagline: 'Does not consider the problem important.',
    description:
      'This customer tolerates the status quo and does not view the problem as an urgent issue. The founder must uncover their true operational priorities rather than trying to manufacture artificial urgency.',
    behaviorCues: [
      'States that current tools are "good enough"',
      'Shows low energy around operational friction',
      'Ranks the problem low on quarterly priorities',
      'Unwilling to invest effort into changing workflows',
      'Challenges whether the issue justifies switching',
    ],
    traits: [
      { label: 'Passive', description: 'Content with current workarounds' },
      { label: 'Unconvinced', description: 'Does not see immediate need to change' },
      { label: 'Low-urgency', description: 'Problem is not a top priority' },
    ],
    difficulty: 'hard',
    icon: 'MinusCircle',
  },
];

export const investorPersonas: Persona[] = [
  {
    id: 'skeptical-vc',
    category: 'investor',
    name: 'Skeptical VC',
    tagline: 'Heard a thousand pitches. Not easily impressed.',
    description:
      'This investor is experienced and highly skeptical. They\'ve seen every pitch pattern and will challenge your key assumptions aggressively. Only concrete evidence will move the needle.',
    behaviorCues: [
      'Challenges every major claim',
      'Asks for data behind assertions',
      'Questions market size calculations',
      'Probes for weaknesses in the model',
      'Increases pressure when answers are weak',
    ],
    traits: [
      { label: 'Skeptical', description: 'Default position is doubt' },
      { label: 'Experienced', description: 'References patterns from other startups' },
      { label: 'Precise', description: 'Wants exact numbers and specifics' },
    ],
    difficulty: 'hard',
    icon: 'TrendingDown',
  },
  {
    id: 'numbers-focused',
    category: 'investor',
    name: 'Numbers-Focused Investor',
    tagline: 'If it\'s not in the data, it doesn\'t exist.',
    description:
      'This investor lives in spreadsheets. They care deeply about unit economics, CAC, LTV, burn rate, runway, and growth metrics. A great story without numbers leaves them cold.',
    behaviorCues: [
      'Asks about CAC, LTV, margins immediately',
      'Requests specific figures for every claim',
      'Follows up on financial projections critically',
      'Challenges "hockey stick" growth assumptions',
      'Wants to understand the unit economics in detail',
    ],
    traits: [
      { label: 'Quantitative', description: 'Everything needs a number' },
      { label: 'Methodical', description: 'Systematic line of questioning' },
      { label: 'Precise', description: 'No vagueness tolerated' },
    ],
    difficulty: 'hard',
    icon: 'BarChart3',
  },
  {
    id: 'industry-expert',
    category: 'investor',
    name: 'Industry Expert',
    tagline: 'Knows the space deeply. Will spot gaps immediately.',
    description:
      'This investor has deep domain expertise in the founder\'s industry. They\'ll ask nuanced questions about competitors, regulatory landscape, and technical feasibility that reveal whether the founder truly understands their market.',
    behaviorCues: [
      'References specific competitors by name',
      'Asks about regulatory implications',
      'Probes technical feasibility deeply',
      'Questions assumptions about customer behavior',
      'Draws on industry history and failed attempts',
    ],
    traits: [
      { label: 'Expert', description: 'Deep domain knowledge' },
      { label: 'Nuanced', description: 'Asks sophisticated questions' },
      { label: 'Probing', description: 'Looks for hidden blind spots' },
    ],
    difficulty: 'hard',
    icon: 'Microscope',
  },
  {
    id: 'aggressive',
    category: 'investor',
    name: 'Aggressive Investor',
    tagline: 'High pressure. No patience for uncertainty.',
    description:
      'This investor uses pressure tactics, interrupts, and challenges confidence directly. They want to see how the founder handles stress, disagreement, and aggressive questioning in real-time.',
    behaviorCues: [
      'Interrupts and pushes back immediately',
      'Challenges the founder\'s confidence directly',
      'Asks rapid-fire follow-up questions',
      'Dismisses weak answers curtly',
      'Uses silence as pressure',
    ],
    traits: [
      { label: 'Aggressive', description: 'High-pressure communication style' },
      { label: 'Fast-paced', description: 'Rapid questioning rhythm' },
      { label: 'Blunt', description: 'Direct, sometimes harsh feedback' },
    ],
    difficulty: 'hard',
    icon: 'Flame',
  },
  {
    id: 'angel',
    category: 'investor',
    name: 'Early-Stage Angel',
    tagline: 'Bets on people as much as ideas.',
    description:
      'This angel investor is more collaborative and founder-friendly. They care deeply about the founder\'s story, passion, and vision. But they still want clarity on the opportunity and ask thoughtful questions.',
    behaviorCues: [
      'Asks about the founder\'s personal motivation',
      'Interested in the team background',
      'More collaborative, less adversarial',
      'Asks about early customer learnings',
      'Still challenges — but with curiosity, not aggression',
    ],
    traits: [
      { label: 'Collaborative', description: 'Supportive questioning style' },
      { label: 'Story-driven', description: 'Cares about the why' },
      { label: 'Curious', description: 'Genuinely interested in learning' },
    ],
    difficulty: 'easy',
    icon: 'Lightbulb',
  },
];

export const allPersonas: Persona[] = [...customerPersonas, ...investorPersonas];

export const getPersonaById = (id: string): Persona | undefined =>
  allPersonas.find((p) => p.id === id);
