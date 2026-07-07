import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '@/lib/api';

/** Invalidate the parent customer detail after any interaction mutation. */
function useInvalidateCustomer(customerId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['customer', customerId] });
}

export function useAddNote(customerId: string) {
  const invalidate = useInvalidateCustomer(customerId);
  return useMutation({
    mutationFn: (body: string) => api.post('/notes', { customerId, body }),
    onSuccess: () => {
      invalidate();
      toast.success('Note added');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useDeleteNote(customerId: string) {
  const invalidate = useInvalidateCustomer(customerId);
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: invalidate,
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useLogEmail(customerId: string) {
  const invalidate = useInvalidateCustomer(customerId);
  return useMutation({
    mutationFn: (payload: { subject: string; body: string; toAddr: string; fromAddr: string; direction: 'INBOUND' | 'OUTBOUND' }) =>
      api.post('/emails', { customerId, ...payload }),
    onSuccess: () => {
      invalidate();
      toast.success('Email logged');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUploadFile(customerId: string) {
  const invalidate = useInvalidateCustomer(customerId);
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      form.append('customerId', customerId);
      return api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      invalidate();
      toast.success('File uploaded');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}
