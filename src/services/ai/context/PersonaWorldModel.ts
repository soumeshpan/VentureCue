/**
 * VentureCue — Private Persona World Models
 * Establishes isolated, rich, grounded private world models for simulated
 * customer and investor personas.
 *
 * CRITICAL RULE:
 * This private world is NEVER mixed with internal VentureCue scoring,
 * engine telemetry (e.g. trustLevel, patienceLevel, revealedLayer),
 * or founder evaluation criteria.
 */

import type { Persona } from '../../../types/persona';
import type { DiscoveryContext } from '../../../types/discovery';
import type { PitchSetup } from '../../../types/pitch';

export interface CustomerPrivateWorld {
  personaId: string;
  role: string;
  companyContext: string;
  workflow: string[];
  currentTools: string[];
  realPain: string;
  recentIncident: {
    when: string;
    whatHappened: string;
    consequence: string;
    costOrTimeWasted: string;
  };
  buyingConstraints: string[];
  urgency: 'low' | 'medium' | 'high';
  emotionalBaseline: string;
  unknowns: string[]; // Things they explicitly do NOT know
}

export interface InvestorPrivateWorld {
  personaId: string;
  partnerName: string;
  fundProfile: string;
  focusArea: 'metrics' | 'defensibility' | 'product_experience';
  standardMetricsDemanded: string[];
  skepticismTriggers: string[];
  evaluationAngle: string;
}

export class PersonaWorldModel {
  /**
   * Sanitizes any raw founder tool input to ensure the customer only uses
   * realistic workplace tools (e.g. "Excel and email") rather than echoing
   * competitor lists or founder pitch sentences.
   */
  public static sanitizeToolName(rawTool?: string): string {
    if (!rawTool || typeof rawTool !== 'string') return 'spreadsheets and email';
    const trimmed = rawTool.trim();
    if (trimmed.length === 0) return 'spreadsheets and email';

    // If input is a long descriptive sentence (> 5 words) or contains startup/competitor text, extract a clean tool
    if (
      trimmed.split(/\s+/).length > 5 ||
      trimmed.length > 35 ||
      /mentor|accelerator|peer feedback|mock interview|chatbot|venturecue|competitor|alternative|they rely on/i.test(trimmed)
    ) {
      if (/excel/i.test(trimmed)) return 'Excel spreadsheets';
      if (/sheet/i.test(trimmed)) return 'Google Sheets';
      if (/notion/i.test(trimmed)) return 'Notion';
      if (/crm|salesforce/i.test(trimmed)) return 'Salesforce';
      return 'shared spreadsheets and email';
    }

    return trimmed;
  }

  /**
   * Sanitizes target customer role to ensure clean organizational grounding.
   */
  public static sanitizeTargetCustomer(rawCustomer?: string): string {
    if (!rawCustomer || typeof rawCustomer !== 'string') return 'Mid-market company';
    const trimmed = rawCustomer.trim();
    if (trimmed.length === 0 || trimmed.length > 45 || /founder|startup|venturecue/i.test(trimmed)) {
      return 'Mid-market business';
    }
    return trimmed;
  }

  /**
   * Generates a grounded private world model for a customer persona,
   * synthesizing concrete workplace details based on the founder's target domain.
   */
  public static getCustomerWorld(persona: Persona, context?: DiscoveryContext): CustomerPrivateWorld {
    const personaId = persona.id || 'skeptic';
    const targetCustomer = this.sanitizeTargetCustomer(context?.targetCustomer);
    const currentTool = this.sanitizeToolName(context?.currentSolution);

    switch (personaId) {
      case 'skeptic':
        return {
          personaId: 'skeptic',
          role: 'Senior Operations Lead',
          companyContext: `Managing an operations team of 14 at a ${targetCustomer}. Process stability is paramount.`,
          workflow: [
            'Team receives incoming data and project requests via email and forms',
            `Manual verification and row-by-row logging in ${currentTool}`,
            'Weekly reconciliation on Friday afternoons before executive reporting',
          ],
          currentTools: [currentTool, 'Google Drive', 'Slack'],
          realPain: 'Data inconsistencies slip through during month-end surges, but team has built custom scripts to catch 90% of them.',
          recentIncident: {
            when: 'Three weeks ago',
            whatHappened: 'A cell formatting error broke a formula during executive review.',
            consequence: 'Had to spend 4 hours on a Friday night re-validating the calculations.',
            costOrTimeWasted: '4 hours of overtime for 2 people ($350 equivalent).',
          },
          buyingConstraints: [
            'Will not adopt any tool requiring more than 2 hours of staff retraining',
            'Security and IT approval takes 6 months for new SaaS vendors',
            'Must see proof that existing workflow is truly broken before considering switching',
          ],
          urgency: 'low',
          emotionalBaseline: 'Pragmatic, cautious, protective of team bandwidth, values evidence over marketing claims.',
          unknowns: ['Does not know exact software procurement budgets for next fiscal year', 'Does not know roadmap of competitors'],
        };

      case 'busy':
        return {
          personaId: 'busy',
          role: 'VP of Department / Team Lead',
          companyContext: `Leading high-velocity operations at a ${targetCustomer}. Back-to-back calendar all day.`,
          workflow: [
            'Checks status dashboard for 10 minutes first thing in the morning',
            `Flags blocking tickets and communicates updates in ${currentTool}`,
            'Delegates execution to team leads',
          ],
          currentTools: [currentTool, 'Calendar', 'Slack', 'Email'],
          realPain: 'Status updates are scattered across 4 channels, wasting 20 minutes before every standup.',
          recentIncident: {
            when: 'Last Tuesday',
            whatHappened: 'Missed an urgent client update because it was buried in a shared sheet.',
            consequence: 'Client called directly asking why onboarding was stalled.',
            costOrTimeWasted: '45 minutes of frantic damage control right before an all-hands.',
          },
          buyingConstraints: [
            'Tool must deliver tangible value in under 5 minutes without setup friction',
            'Zero patience for sales demos or lengthy training calls',
          ],
          urgency: 'high',
          emotionalBaseline: 'Time-pressured, concise, direct, expects fast answers, hates fluff.',
          unknowns: ['Does not know line-item breakdown of junior staff hourly tasks', 'Does not know technical API details'],
        };

      case 'talkative':
        return {
          personaId: 'talkative',
          role: 'Operations & Community Coordinator',
          companyContext: `At a growing ${targetCustomer}. Has been with the company 4 years and knows everyone.`,
          workflow: [
            'Collects feedback from various internal stakeholders daily',
            `Organizes notes, project trackers, and schedules inside ${currentTool}`,
            'Shares periodic summaries and runs check-in meetings',
          ],
          currentTools: [currentTool, 'Notion', 'Google Docs', 'Zoom'],
          realPain: 'People keep creating duplicate sheets and forgetting where the canonical document lives.',
          recentIncident: {
            when: 'Last Thursday',
            whatHappened: 'Someone duplicated the main tracking sheet and worked off the outdated copy for three days.',
            consequence: 'Had to manually merge 85 rows of changes while team waited.',
            costOrTimeWasted: 'An entire afternoon (about 5 hours) plus ordering emergency coffee/donuts.',
          },
          buyingConstraints: [
            'Whole team must love the user interface or adoption drops to zero within 2 weeks',
            'Prefers intuitive, visually pleasing software over complex enterprise systems',
          ],
          urgency: 'medium',
          emotionalBaseline: 'Friendly, expressive, shares anecdotes, passionate about workplace harmony.',
          unknowns: ['Does not control enterprise budget sign-off', 'Does not know backend database infrastructure'],
        };

      case 'frustrated':
        return {
          personaId: 'frustrated',
          role: 'Senior Project / Workflow Manager',
          companyContext: `In the trenches at a ${targetCustomer} dealing with legacy system breakdowns.`,
          workflow: [
            'Receives high volumes of project requests daily',
            `Attempts to route and track them through ${currentTool}`,
            'Constantly firefighting handoff delays between departments',
          ],
          currentTools: [currentTool, 'Shared spreadsheets', 'Email'],
          realPain: 'Handoffs fail constantly because departments use incompatible conventions and nobody follows the documented process.',
          recentIncident: {
            when: 'Just yesterday afternoon',
            whatHappened: 'A critical handoff was dropped because an update got lost in our sheet.',
            consequence: 'Project missed client deadline and I spent two hours on damage control with our director.',
            costOrTimeWasted: '6 hours of emergency meeting escalations and severe stress.',
          },
          buyingConstraints: [
            'Tired of false vendor promises that create more work for staff',
            'Needs immediate, rock-solid reliability rather than trendy buzzword features',
          ],
          urgency: 'high',
          emotionalBaseline: 'Stressed by broken processes, professional but blunt, demands real practical fixes.',
          unknowns: ['Does not know company-wide executive strategic 5-year vision', 'Does not have authority to bypass IT security'],
        };

      case 'polite-agreer':
        return {
          personaId: 'polite-agreer',
          role: 'Customer Success / Partnerships Lead',
          companyContext: `Working at a ${targetCustomer}. Enjoys meeting new people and networking.`,
          workflow: [
            'Talks with clients and internal team daily',
            `Logs notes and client requests into ${currentTool}`,
            'Coordinates with product and engineering teams',
          ],
          currentTools: [currentTool, 'HubSpot', 'Slack', 'Email'],
          realPain: 'Process is slightly clunky, but manageable. Not suffering enough to fight for new software budget.',
          recentIncident: {
            when: 'A couple of weeks ago',
            whatHappened: 'Client asked for a historical summary and it took 20 minutes to pull up.',
            consequence: 'Mild embarrassment on the call, but client was understanding.',
            costOrTimeWasted: '20 minutes.',
          },
          buyingConstraints: [
            'Has zero purchasing budget authority',
            'Naturally inclined to give encouraging feedback to be supportive, regardless of actual buying intent',
          ],
          urgency: 'low',
          emotionalBaseline: 'Warm, polite, supportive, agreeable, rarely says no directly even when uninterested.',
          unknowns: ['Does not know pricing or procurement approval details', 'Does not know department budget numbers'],
        };

      case 'indifferent':
      default:
        return {
          personaId: 'indifferent',
          role: 'Administrative / Department Specialist',
          companyContext: `Working steady hours at a ${targetCustomer}. Satisfied with current routines.`,
          workflow: [
            'Performs routine administrative tasks and data lookups',
            `Updates records in ${currentTool} as required`,
            'Signs off on standard departmental items',
          ],
          currentTools: [currentTool, 'Email', 'Excel'],
          realPain: 'Minor routine friction that takes 10 minutes a day, but feels completely normal and acceptable.',
          recentIncident: {
            when: 'Last month',
            whatHappened: 'A spreadsheet formula had a typo.',
            consequence: 'Fixed it in 5 minutes.',
            costOrTimeWasted: '5 minutes.',
          },
          buyingConstraints: [
            'Company has strict budget freeze on new software',
            'No personal incentive or desire to change working habits',
          ],
          urgency: 'low',
          emotionalBaseline: 'Uninterested in new tools, content with status quo, shows little emotional investment.',
          unknowns: ['Does not know why management picked current tools', 'Does not know strategic technology roadmap'],
        };
    }
  }

  /**
   * Generates a grounded private world model for an investor persona.
   */
  public static getInvestorWorld(persona: Persona, setup?: PitchSetup): InvestorPrivateWorld {
    const personaId = persona.id || 'numbers-focused';

    switch (personaId) {
      case 'numbers-focused':
        return {
          personaId: 'numbers-focused',
          partnerName: 'Victoria Chen (Managing Partner)',
          fundProfile: 'Early-stage B2B SaaS Fund ($75M AUM, investing $500k–$1.5M seeds).',
          focusArea: 'metrics',
          standardMetricsDemanded: [
            'Monthly Recurring Revenue (MRR) & MoM growth rate',
            'Customer Acquisition Cost (CAC) & Payback period (months)',
            'Lifetime Value (LTV) & Net Revenue Retention (NRR)',
            'Gross Margin percentage & Burn multiple',
          ],
          skepticismTriggers: [
            'Vague claims like "massive market" without unit economic backing',
            'Conflating GMV or total pipeline value with actual realized ARR/MRR',
            'Ignoring payback periods or assuming zero marketing spend',
          ],
          evaluationAngle: 'Believes great businesses are built on disciplined unit economics, capital efficiency, and measurable customer retention.',
        };

      case 'skeptical-investor':
        return {
          personaId: 'skeptical-investor',
          partnerName: 'Marcus Vance (General Partner)',
          fundProfile: 'Deep Tech & Enterprise Venture Fund ($120M AUM).',
          focusArea: 'defensibility',
          standardMetricsDemanded: [
            'Core technological moat or proprietary data advantage',
            'Switching costs preventing customers from churning to incumbents',
            'Direct competitor benchmarks (Salesforce, Microsoft, specialized competitors)',
            'Distribution advantages that cannot be copied easily',
          ],
          skepticismTriggers: [
            'Saying "we have no competitors" or "we are the first"',
            'Thin wrapper solutions on top of third-party commodity APIs',
            'Assuming large incumbents will not build the same feature in 6 months',
          ],
          evaluationAngle: 'Looks for defensible moats and unfair distribution advantages that will protect the startup from competitive extinction.',
        };

      case 'product-focused':
      default:
        return {
          personaId: 'product-focused',
          partnerName: 'Elena Rostova (Seed Partner & Ex-Founder)',
          fundProfile: 'Founder-led Seed Micro-Fund ($30M AUM).',
          focusArea: 'product_experience',
          standardMetricsDemanded: [
            'Day-1 user onboarding retention & Daily/Weekly Active User ratio (DAU/WAU)',
            'The core "aha moment" where users realize they cannot live without the tool',
            'Organic referral / viral coefficient & word-of-mouth adoption',
            'Qualitative churn feedback: Why do churned users leave?',
          ],
          skepticismTriggers: [
            'Feature bloat without clear customer problem obsession',
            'High upfront drop-off before users experience core value',
            'Building what founders think users want without watching users struggle',
          ],
          evaluationAngle: 'Believes superior product experience, extreme user love, and organic engagement are the only true drivers of durable venture scale.',
        };
    }
  }
}
