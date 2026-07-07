import type {
  LeadScoreInput,
  LeadScore,
  EmailDraftInput,
  EmailDraft,
  MeetingSummary,
} from './AiProvider.js';

/**
 * Deterministic, dependency-free implementations of the AI capabilities.
 * Used by the mock provider (so the app runs with zero API keys) and as a
 * graceful fallback when a real provider returns unparseable output.
 */

export function heuristicLeadScore(i: LeadScoreInput): LeadScore {
  let score = 30;

  if (i.value >= 50_000) score += 25;
  else if (i.value >= 10_000) score += 15;
  else if (i.value > 0) score += 8;

  const statusBoost: Record<string, number> = {
    NEW: 0, CONTACTED: 8, QUALIFIED: 20, UNQUALIFIED: -25, CONVERTED: 35,
  };
  score += statusBoost[i.status] ?? 0;

  const sourceBoost: Record<string, number> = {
    REFERRAL: 15, EVENT: 10, WEBSITE: 6, SOCIAL: 4, EMAIL_CAMPAIGN: 4, COLD_CALL: 2, OTHER: 0,
  };
  score += sourceBoost[i.source] ?? 0;

  if (i.hasContactEmail) score += 6;
  if (i.hasContactPhone) score += 4;
  score += Math.min(i.activityCount * 3, 15);

  if (i.ageDays > 30) score -= 10;
  else if (i.ageDays > 14) score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating: LeadScore['rating'] = score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD';

  const reasons: string[] = [];
  if (i.value > 0) reasons.push(`$${i.value.toLocaleString()} potential value`);
  reasons.push(`${i.status.toLowerCase()} status`);
  reasons.push(`${i.source.replace(/_/g, ' ').toLowerCase()} source`);
  if (i.activityCount) reasons.push(`${i.activityCount} recorded interaction${i.activityCount === 1 ? '' : 's'}`);
  reasons.push(i.ageDays <= 14 ? 'recently created' : `${i.ageDays} days old`);

  return { score, rating, reason: `Scored ${score}/100 (${rating}) — ${reasons.join(', ')}.` };
}

export function heuristicEmail(i: EmailDraftInput): EmailDraft {
  const first = i.customerName.split(' ')[0] || i.customerName;
  const subject = `${i.purpose} — ${i.company ?? i.customerName}`.slice(0, 120);

  const toneOpener: Record<string, string> = {
    FRIENDLY: `Hope you're doing well!`,
    FORMAL: `I hope this message finds you well.`,
    CONCISE: '',
  };
  const lastEmail = [...i.context.emails].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())[0];
  const contextLine = lastEmail ? `Following up on our exchange about "${lastEmail.subject}", ` : '';

  const body = [
    `Hi ${first},`,
    '',
    [toneOpener[i.tone], `${contextLine}I wanted to reach out regarding ${i.purpose.toLowerCase()}.`]
      .filter(Boolean)
      .join(' '),
    '',
    `Would you have time this week for a quick chat? I'd be glad to walk you through the details and answer any questions.`,
    '',
    'Best regards,',
  ].join('\n');

  return { subject, body };
}

export function heuristicMeetingSummary(customerName: string, transcript: string): MeetingSummary {
  const sentences = transcript
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const actionRe = /(follow ?up|send|schedule|share|prepare|review|call|email|set up|next step|action|deliver|book|invite)/i;
  const actionItems = sentences.filter((s) => actionRe.test(s)).slice(0, 6);
  const keyPoints = sentences.filter((s) => !actionItems.includes(s)).slice(0, 6);

  return {
    summary: sentences.slice(0, 2).join(' ') || `Meeting notes recorded for ${customerName}.`,
    keyPoints: keyPoints.length ? keyPoints : sentences.slice(0, 3),
    actionItems: actionItems.length ? actionItems : ['Follow up with the customer to confirm next steps.'],
  };
}
