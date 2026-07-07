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
import { heuristicLeadScore, heuristicEmail, heuristicMeetingSummary } from './heuristics.js';

/**
 * Deterministic, dependency-free provider used by default so the whole app
 * runs with zero API keys. It produces genuinely useful, data-derived output
 * by analysing the interaction history — not random placeholder text.
 */
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';

  async summarizeInteractions(input: InteractionInput): Promise<string> {
    const totalTouches =
      input.activities.length + input.emails.length + input.notes.length;
    const lastEmail = [...input.emails].sort(
      (a, b) => b.sentAt.getTime() - a.sentAt.getTime(),
    )[0];
    const outbound = input.emails.filter((e) => e.direction === 'OUTBOUND').length;
    const inbound = input.emails.filter((e) => e.direction === 'INBOUND').length;
    const callCount = input.activities.filter((a) => a.type === 'CALL').length;
    const meetingCount = input.activities.filter((a) => a.type === 'MEETING').length;

    const parts: string[] = [];
    parts.push(
      `${input.customerName}${input.company ? ` (${input.company})` : ''} has ${totalTouches} recorded interaction${totalTouches === 1 ? '' : 's'}.`,
    );
    if (input.emails.length) {
      parts.push(
        `Email exchange shows ${outbound} outbound and ${inbound} inbound message${inbound === 1 ? '' : 's'}${lastEmail ? `, most recently "${lastEmail.subject}".` : '.'}`,
      );
    }
    if (callCount || meetingCount) {
      parts.push(
        `Engagement includes ${callCount} call${callCount === 1 ? '' : 's'} and ${meetingCount} meeting${meetingCount === 1 ? '' : 's'}.`,
      );
    }
    const engagement = inbound >= outbound && totalTouches > 3 ? 'warm and responsive' : totalTouches > 0 ? 'active but one-sided' : 'not yet engaged';
    parts.push(`Overall the relationship reads as ${engagement}.`);
    return parts.join(' ');
  }

  async suggestFollowUps(input: InteractionInput): Promise<FollowUpSuggestion[]> {
    const suggestions: FollowUpSuggestion[] = [];
    const now = Date.now();
    const lastEmail = [...input.emails].sort(
      (a, b) => b.sentAt.getTime() - a.sentAt.getTime(),
    )[0];
    const daysSinceEmail = lastEmail
      ? Math.floor((now - lastEmail.sentAt.getTime()) / 86_400_000)
      : null;

    if (daysSinceEmail === null) {
      suggestions.push({
        title: `Send an introductory email to ${input.customerName}`,
        reason: 'No email history exists yet — open the channel with a personalised intro.',
        priority: 'HIGH',
      });
    } else if (daysSinceEmail > 7) {
      suggestions.push({
        title: `Re-engage ${input.customerName} — ${daysSinceEmail} days since last email`,
        reason: 'Conversation has gone cold; a check-in keeps the deal warm.',
        priority: daysSinceEmail > 21 ? 'HIGH' : 'MEDIUM',
      });
    }

    const lastInbound = input.emails.filter((e) => e.direction === 'INBOUND').at(-1);
    const lastOutbound = input.emails.filter((e) => e.direction === 'OUTBOUND').at(-1);
    if (lastInbound && (!lastOutbound || lastInbound.sentAt > lastOutbound.sentAt)) {
      suggestions.push({
        title: `Reply to "${lastInbound.subject}"`,
        reason: 'The customer sent the last message and is awaiting a response.',
        priority: 'HIGH',
      });
    }

    if (!input.activities.some((a) => a.type === 'MEETING')) {
      suggestions.push({
        title: `Schedule a discovery call with ${input.customerName}`,
        reason: 'No meeting on record — a live conversation accelerates qualification.',
        priority: 'MEDIUM',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: `Share a tailored proposal with ${input.customerName}`,
        reason: 'Engagement is healthy; move the opportunity forward with next steps.',
        priority: 'MEDIUM',
      });
    }

    return suggestions.slice(0, 4);
  }

  async scoreLead(input: LeadScoreInput): Promise<LeadScore> {
    return heuristicLeadScore(input);
  }

  async generateEmail(input: EmailDraftInput): Promise<EmailDraft> {
    return heuristicEmail(input);
  }

  async summarizeMeeting(input: MeetingSummaryInput): Promise<MeetingSummary> {
    return heuristicMeetingSummary(input.customerName, input.transcript);
  }
}
