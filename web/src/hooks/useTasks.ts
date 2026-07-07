import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '@/lib/api';
import type { Task, Paginated, ListEnvelope } from '@/types';

export interface TaskFilters {
  page: number;
  status?: string;
  priority?: string;
  scope?: 'mine' | 'all';
  customerId?: string;
}

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async (): Promise<Paginated<Task>> => {
      const res = await api.get<ListEnvelope<Task>>('/tasks', { params: { limit: 50, ...filters } });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Task>) => (await api.post('/tasks', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Task> & { id: string }) =>
      (await api.patch(`/tasks/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}
