import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '@/lib/api';
import type { Board, Deal } from '@/types';

export function useBoard() {
  return useQuery({
    queryKey: ['deals', 'board'],
    queryFn: async (): Promise<Board> => {
      const res = await api.get<{ data: Board }>('/deals/board');
      return res.data.data;
    },
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Deal> & { stageId: string; customerId: string }) =>
      (await api.post('/deals', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Deal> & { id: string }) =>
      (await api.patch(`/deals/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

/** Persist a drag-and-drop move. Callers apply an optimistic board first. */
export function useMoveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId, position }: { id: string; stageId: string; position: number }) =>
      api.patch(`/deals/${id}/move`, { stageId, position }),
    onError: (e) => {
      toast.error(getApiErrorMessage(e, 'Could not move deal'));
      qc.invalidateQueries({ queryKey: ['deals', 'board'] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['deals', 'board'] }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/deals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}
