import type {
  AiProvider,
  InteractionInput,
  FollowUpSuggestion,
  LeadScoreInput,
  LeadScore,
  EmailDraftInput,
  EmailDraft,
  MeetingSummaryInput,
  MeetingSummary,
} from './AiProvider.js';
import {
  buildContext,
  SUMMARY_SYSTEM,
  FOLLOWUP_SYSTEM,
  parseFollowUps,
  LEAD_SCORE_SYSTEM,
  buildLeadScoreContext,
  parseLeadScore,
  EMAIL_SYSTEM,
  buildEmailContext,
  parseEmail,
  MEETING_SYSTEM,
  parseMeetingSummary,
} from './prompts.js';

/**
 * Shared implementation for HTTP-based providers (OpenAI, Anthropic). Concrete
 * providers only implement `name` and the low-level `call`; all prompt building
 * and response parsing lives here so the capabilities stay identical across
 * vendors and there is a single place to add new AI features.
 */
export abstract class BaseHttpAiProvider implements AiProvider {
  abstract readonly name: string;

  /** Send a system+user prompt to the model and return the raw text. */
  protected abstract call(system: string, user: string, maxTokens: number): Promise<string>;

  summarizeInteractions(input: InteractionInput): Promise<string> {
    return this.call(SUMMARY_SYSTEM, buildContext(input), 400);
  }

  async suggestFollowUps(input: InteractionInput): Promise<FollowUpSuggestion[]> {
    return parseFollowUps(await this.call(FOLLOWUP_SYSTEM, buildContext(input), 600));
  }

  async scoreLead(input: LeadScoreInput): Promise<LeadScore> {
    return parseLeadScore(await this.call(LEAD_SCORE_SYSTEM, buildLeadScoreContext(input), 300), input);
  }

  async generateEmail(input: EmailDraftInput): Promise<EmailDraft> {
    return parseEmail(await this.call(EMAIL_SYSTEM, buildEmailContext(input), 700), input);
  }

  async summarizeMeeting(input: MeetingSummaryInput): Promise<MeetingSummary> {
    const user = `Customer: ${input.customerName}\n\nTranscript / raw notes:\n${input.transcript}`;
    return parseMeetingSummary(await this.call(MEETING_SYSTEM, user, 700), input.customerName, input.transcript);
  }
}
