import type { DiscoveryContext, Assumption, DiscoveryEvent } from '../../types/discovery';
import type { Persona } from '../../types/persona';
import type { Difficulty, TranscriptLine, Session, SessionDebrief } from '../../types/session';

export interface CustomerResponseResult {
  text: string;
  events: DiscoveryEvent[];
}

export interface AIConversationService {
  generateAssumptions(context: DiscoveryContext): Promise<Assumption[]>;
  generateCustomerResponse(params: {
    context: DiscoveryContext;
    assumptions: Assumption[];
    persona: Persona;
    difficulty: Difficulty;
    history: TranscriptLine[];
    latestUserMessage: string;
  }): Promise<CustomerResponseResult>;
  evaluateDiscoveryConversation(params: {
    session: Session;
    context: DiscoveryContext;
    assumptions: Assumption[];
    persona: Persona;
    difficulty: Difficulty;
  }): Promise<SessionDebrief>;
}
