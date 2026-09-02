import type { DiscoveryContext, Assumption } from '../../types/discovery';

export class AssumptionService {
  /**
   * Generates structured, discovery-focused hypotheses based on founder input and materials.
   */
  static generateAssumptions(context: DiscoveryContext): Assumption[] {
    const customer = context.targetCustomer.trim() || 'Target users';
    const problem = context.problemHypothesis.trim() || 'the existing operational bottleneck';
    const building = context.whatBuilding.trim() || 'this solution';
    const currentAlt = context.currentSolution?.trim() || 'manual workarounds or spreadsheets';
    const beliefs = context.currentBeliefs?.trim() || '';

    const assumptions: Assumption[] = [
      {
        id: `asmp-${Date.now()}-1`,
        statement: `${customer} experience ${problem} frequently enough to actively seek an alternative to ${currentAlt}.`,
        category: 'problem',
        whyItMatters: 'If the problem happens only rarely, customers will tolerate existing workarounds rather than adopting a new product.',
        evidenceNeeded: 'Concrete examples from the past 30-90 days where this issue interrupted their workflow or caused measurable delay/loss.',
        validationStatus: 'unvalidated',
        selected: true,
      },
      {
        id: `asmp-${Date.now()}-2`,
        statement: `The current workaround (${currentAlt}) is causing severe friction, financial cost, or frustration for ${customer}.`,
        category: 'behavior',
        whyItMatters: 'Founders often overestimate how much users hate their current tools. "Good enough" is the #1 competitor.',
        evidenceNeeded: 'Statements of real money, time, or emotional energy spent trying to fix or cope with the current process.',
        validationStatus: 'unvalidated',
        selected: true,
      },
      {
        id: `asmp-${Date.now()}-3`,
        statement: `${customer} have dedicated budget or autonomous authority to purchase or implement ${building}.`,
        category: 'customer',
        whyItMatters: 'Validating that a user has pain is useless if they lack purchasing power or require complex internal approvals.',
        evidenceNeeded: 'Past software purchase history or details on who approves operational workflow changes in their organization.',
        validationStatus: 'unvalidated',
        selected: true,
      },
      {
        id: `asmp-${Date.now()}-4`,
        statement: `Switching away from ${currentAlt} has low enough friction that ${customer} will actually migrate.`,
        category: 'behavior',
        whyItMatters: 'High inertia or switching costs will prevent adoption even when your solution is objectively superior.',
        evidenceNeeded: 'Stories of previous tool migrations: how painful was it, what failed, and what made them switch.',
        validationStatus: 'unvalidated',
        selected: false,
      },
    ];

    // If founder specified current beliefs, turn it into a dedicated assumption to test
    if (beliefs.length > 5) {
      assumptions.push({
        id: `asmp-${Date.now()}-5`,
        statement: `${customer} prioritize solving: "${beliefs.slice(0, 100)}${beliefs.length > 100 ? '...' : ''}" above their other top 3 priorities.`,
        category: 'market',
        whyItMatters: 'A problem can be real but still rank #7 on their daily priority list, meaning it will never get funded.',
        evidenceNeeded: 'A ranking of their top operational challenges and where this specific issue fits in their quarterly focus.',
        validationStatus: 'unvalidated',
        selected: true,
      });
    } else {
      assumptions.push({
        id: `asmp-${Date.now()}-5`,
        statement: `${customer} consider solving this problem one of their top 3 operational priorities this quarter.`,
        category: 'market',
        whyItMatters: 'If this issue is ranked low on priority, deals will stall and engagement will drop off after onboarding.',
        evidenceNeeded: 'Explicit evidence of current time or money allocated to addressing this issue right now.',
        validationStatus: 'unvalidated',
        selected: false,
      });
    }

    return assumptions;
  }
}
