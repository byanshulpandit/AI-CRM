import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateLead, useUpdateLead } from '@/hooks/useLeads';
import type { Lead } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED']),
  source: z.enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EVENT', 'SOCIAL', 'EMAIL_CAMPAIGN', 'OTHER']),
  value: z.coerce.number().min(0),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'].map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }));
const sourceOptions = ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EVENT', 'SOCIAL', 'EMAIL_CAMPAIGN', 'OTHER'].map((v) => ({ value: v, label: v.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) }));

export function LeadFormModal({ open, onClose, lead }: { open: boolean; onClose: () => void; lead?: Lead | null }) {
  const create = useCreateLead();
  const update = useUpdateLead();
  const isEdit = !!lead;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: lead?.title ?? '',
      status: lead?.status ?? 'NEW',
      source: lead?.source ?? 'WEBSITE',
      value: Number(lead?.value ?? 0),
      contactName: lead?.contactName ?? '',
      contactEmail: lead?.contactEmail ?? '',
      contactPhone: lead?.contactPhone ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (isEdit && lead) await update.mutateAsync({ id: lead.id, ...values });
    else await create.mutateAsync(values);
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit lead' : 'New lead'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={isSubmitting}>{isEdit ? 'Save' : 'Create lead'}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Title *" error={errors.title?.message} {...register('title')} />
        </div>
        <Select label="Status" options={statusOptions} {...register('status')} />
        <Select label="Source" options={sourceOptions} {...register('source')} />
        <Input label="Value (USD)" type="number" step="100" error={errors.value?.message} {...register('value')} />
        <Input label="Contact name" {...register('contactName')} />
        <Input label="Contact email" type="email" error={errors.contactEmail?.message} {...register('contactEmail')} />
        <Input label="Contact phone" {...register('contactPhone')} />
      </form>
    </Modal>
  );
}
