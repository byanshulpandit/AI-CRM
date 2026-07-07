import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '@/lib/api';
import type { AiInsight, FollowUpSuggestion, EmailDraft, MeetingSummary, Lead } from '@/types';

export function useSummarizeCustomer(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: { insight: AiInsight; provider: string } }>(
        `/ai/customers/${customerId}/summarize`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', customerId] });
      toast.success('AI summary generated');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'AI request failed')),
  });
}

export function useSuggestFollowUps(customerId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: { suggestions: FollowUpSuggestion[]; provider: string } }>(
        `/ai/customers/${customerId}/suggest-followups`,
      );
      return res.data.data;
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'AI request failed')),
  });
}

export function useDraftEmail(customerId: string) {
  return useMutation({
    mutationFn: async (payload: { purpose: string; tone: 'FRIENDLY' | 'FORMAL' | 'CONCISE' }) => {
      const res = await api.post<{ data: { draft: EmailDraft; provider: string } }>(
        `/ai/customers/${customerId}/draft-email`,
        payload,
      );
      return res.data.data.draft;
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'AI request failed')),
  });
}

export function useMeetingSummary(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { transcript: string; save?: boolean }) => {
      const res = await api.post<{ data: MeetingSummary & { provider: string } }>(
        `/ai/customers/${customerId}/meeting-summary`,
        payload,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', customerId] });
      toast.success('Meeting summarised');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'AI request failed')),
  });
}

export function useScoreLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const res = await api.post<{ data: { lead: Lead; provider: string } }>(`/ai/leads/${leadId}/score`);
      return res.data.data.lead;
    },
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Lead scored ${lead.score}/100 (${lead.scoreRating})`);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'AI request failed')),
  });
}
