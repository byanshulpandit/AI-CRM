import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const res = await api.get<{ data: User[] }>('/users');
      return res.data.data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (payload: Partial<User>) => {
      const res = await api.patch<{ data: User }>('/users/me', payload);
      return res.data.data;
    },
    onSuccess: (user) => {
      setUser(user);
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      api.post('/users/me/password', payload),
    onSuccess: () => toast.success('Password changed'),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; role?: string; isActive?: boolean }) =>
      api.patch(`/users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}
