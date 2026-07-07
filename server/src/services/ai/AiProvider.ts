/**
 * AI provider abstraction. The app never talks to a vendor SDK directly;
 * it depends on this interface. Swap providers via the AI_PROVIDER env var.
 */

export interface InteractionInput {
  customerName: string;
  company?: string | null;
  activities: { type: string; summary: string; createdAt: Date }[];
  emails: { subject: string; body: string; direction: string; sentAt: Date }[];
  notes: { body: string; createdAt: Date }[];
}

export interface FollowUpSuggestion {
  title: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface LeadScoreInput {
  title: string;
  status: string;
  source: string;
  value: number;
  hasContactEmail: boolean;
  hasContactPhone: boolean;
  ageDays: number;
  activityCount: number;
}

export interface LeadScore {
  score: number; // 0-100
  rating: 'COLD' | 'WARM' | 'HOT';
  reason: string;
}

export interface EmailDraftInput {
  customerName: string;
  company?: string | null;
  purpose: string;
  tone: 'FRIENDLY' | 'FORMAL' | 'CONCISE';
  context: InteractionInput;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface MeetingSummaryInput {
  customerName: string;
  transcript: string;
}

export interface MeetingSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export interface AiProvider {
  readonly name: string;
  summarizeInteractions(input: InteractionInput): Promise<string>;
  suggestFollowUps(input: InteractionInput): Promise<FollowUpSuggestion[]>;
  scoreLead(input: LeadScoreInput): Promise<LeadScore>;
  generateEmail(input: EmailDraftInput): Promise<EmailDraft>;
  summarizeMeeting(input: MeetingSummaryInput): Promise<MeetingSummary>;
}
