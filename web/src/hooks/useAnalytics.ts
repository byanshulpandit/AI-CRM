import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardStats } from '@/types';

export interface StageDatum { stage: string; color: string; count: number; value: number; }
export interface TrendDatum { label: string; value: number; }
export interface SourceDatum { source: string; count: number; }

export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await api.get<{ data: DashboardStats }>('/analytics/dashboard');
      return res.data.data;
    },
  });
}

export function useDealsByStage() {
  return useQuery({
    queryKey: ['analytics', 'deals-by-stage'],
    queryFn: async (): Promise<StageDatum[]> => {
      const res = await api.get<{ data: StageDatum[] }>('/analytics/deals-by-stage');
      return res.data.data;
    },
  });
}

export function useRevenueTrend() {
  return useQuery({
    queryKey: ['analytics', 'revenue-trend'],
    queryFn: async (): Promise<TrendDatum[]> => {
      const res = await api.get<{ data: TrendDatum[] }>('/analytics/revenue-trend');
      return res.data.data;
    },
  });
}

export function useLeadsBySource() {
  return useQuery({
    queryKey: ['analytics', 'leads-by-source'],
    queryFn: async (): Promise<SourceDatum[]> => {
      const res = await api.get<{ data: SourceDatum[] }>('/analytics/leads-by-source');
      return res.data.data;
    },
  });
}
