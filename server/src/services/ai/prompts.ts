import type {
  InteractionInput,
  FollowUpSuggestion,
  LeadScoreInput,
  LeadScore,
  EmailDraftInput,
  EmailDraft,
  MeetingSummary,
} from './AiProvider.js';
import { heuristicLeadScore, heuristicEmail, heuristicMeetingSummary } from './heuristics.js';

/** Extract the first balanced JSON object from a model response. */
function extractJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Render the interaction history into a compact prompt context block. */
export function buildContext(input: InteractionInput): string {
  const lines: string[] = [];
  lines.push(`Customer: ${input.customerName}${input.company ? ` — ${input.company}` : ''}`);
  lines.push('');
  if (input.activities.length) {
    lines.push('Activities:');
    for (const a of input.activities.slice(0, 30)) {
      lines.push(`- [${a.type}] ${a.summary} (${a.createdAt.toISOString().slice(0, 10)})`);
    }
    lines.push('');
  }
  if (input.emails.length) {
    lines.push('Emails:');
    for (const e of input.emails.slice(0, 20)) {
      lines.push(
        `- (${e.direction}) ${e.subject} — ${e.body.slice(0, 200)} (${e.sentAt.toISOString().slice(0, 10)})`,
      );
    }
    lines.push('');
  }
  if (input.notes.length) {
    lines.push('Notes:');
    for (const n of input.notes.slice(0, 20)) {
      lines.push(`- ${n.body.slice(0, 200)} (${n.createdAt.toISOString().slice(0, 10)})`);
    }
  }
  return lines.join('\n');
}

export const SUMMARY_SYSTEM =
  'You are a CRM assistant. Summarise the customer relationship in 3-4 concise sentences for a busy salesperson. Focus on engagement level, open threads, and sentiment. Return plain prose, no markdown.';

export const FOLLOWUP_SYSTEM =
  'You are a CRM assistant. Based on the interaction history, propose up to 4 concrete follow-up actions. Respond ONLY with a JSON array of objects shaped {"title": string, "reason": string, "priority": "LOW"|"MEDIUM"|"HIGH"}. No prose, no code fences.';

/** Best-effort parse of a model response into suggestions. */
export function parseFollowUps(raw: string): FollowUpSuggestion[] {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as FollowUpSuggestion[];
    return parsed
      .filter((s) => s && typeof s.title === 'string')
      .map((s) => ({
        title: s.title,
        reason: s.reason ?? '',
        priority: ['LOW', 'MEDIUM', 'HIGH'].includes(s.priority) ? s.priority : 'MEDIUM',
      }))
      .slice(0, 4);
  } catch {
    return [];
  }
}

// ─────────────────────────── Lead scoring ───────────────────────────

export const LEAD_SCORE_SYSTEM =
  'You are a CRM lead-scoring assistant. Given a lead\'s attributes, estimate its likelihood to convert on a 0-100 scale. Respond ONLY with JSON {"score": number, "rating": "COLD"|"WARM"|"HOT", "reason": string}. No prose, no code fences.';

export function buildLeadScoreContext(i: LeadScoreInput): string {
  return [
    `Title: ${i.title}`,
    `Status: ${i.status}`,
    `Source: ${i.source}`,
    `Potential value: $${i.value}`,
    `Has contact email: ${i.hasContactEmail}`,
    `Has contact phone: ${i.hasContactPhone}`,
    `Age (days): ${i.ageDays}`,
    `Recorded interactions: ${i.activityCount}`,
  ].join('\n');
}

export function parseLeadScore(raw: string, fallback: LeadScoreInput): LeadScore {
  const obj = extractJsonObject(raw);
  if (obj && typeof obj.score === 'number') {
    const score = Math.max(0, Math.min(100, Math.round(obj.score)));
    const rating = ['COLD', 'WARM', 'HOT'].includes(obj.rating as string)
      ? (obj.rating as LeadScore['rating'])
      : score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD';
    return { score, rating, reason: typeof obj.reason === 'string' ? obj.reason : `Scored ${score}/100.` };
  }
  return heuristicLeadScore(fallback);
}

// ─────────────────────────── Email drafting ─────────────────────────

export const EMAIL_SYSTEM =
  'You are a sales assistant that drafts concise, personalised outreach emails. Respond ONLY with JSON {"subject": string, "body": string}. The body must be plain text using \\n line breaks — no markdown, no code fences.';

export function buildEmailContext(i: EmailDraftInput): string {
  return [
    `Recipient: ${i.customerName}${i.company ? ` (${i.company})` : ''}`,
    `Purpose: ${i.purpose}`,
    `Tone: ${i.tone}`,
    '',
    'Relationship context:',
    buildContext(i.context),
  ].join('\n');
}

export function parseEmail(raw: string, fallback: EmailDraftInput): EmailDraft {
  const obj = extractJsonObject(raw);
  if (obj && typeof obj.subject === 'string' && typeof obj.body === 'string') {
    return { subject: obj.subject, body: obj.body };
  }
  return heuristicEmail(fallback);
}

// ─────────────────────────── Meeting summaries ──────────────────────

export const MEETING_SYSTEM =
  'You are a meeting-notes assistant. Summarise the meeting, then extract key points and action items. Respond ONLY with JSON {"summary": string, "keyPoints": string[], "actionItems": string[]}. No prose, no code fences.';

export function parseMeetingSummary(raw: string, customerName: string, transcript: string): MeetingSummary {
  const obj = extractJsonObject(raw);
  if (obj && typeof obj.summary === 'string') {
    const asStrings = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 8) : [];
    return {
      summary: obj.summary,
      keyPoints: asStrings(obj.keyPoints),
      actionItems: asStrings(obj.actionItems),
    };
  }
  return heuristicMeetingSummary(customerName, transcript);
}
