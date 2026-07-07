import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE', 'CHURNED']),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  city: z.string().optional(),
  country: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const statusOptions = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'CHURNED', label: 'Churned' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export function CustomerFormModal({ open, onClose, customer }: Props) {
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const isEdit = !!customer;

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: customer?.name ?? '',
      company: customer?.company ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      status: customer?.status ?? 'LEAD',
      website: customer?.website ?? '',
      city: customer?.city ?? '',
      country: customer?.country ?? '',
      tags: customer?.tags?.join(', ') ?? '',
      notes: customer?.notes ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    if (isEdit && customer) {
      await update.mutateAsync({ id: customer.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    reset();
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit customer' : 'New customer'}
      description={isEdit ? 'Update this customer record.' : 'Add a customer to your CRM.'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={isSubmitting}>{isEdit ? 'Save changes' : 'Create customer'}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Full name *" error={errors.name?.message} {...register('name')} />
        <Input label="Company" {...register('company')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" {...register('phone')} />
        <Select label="Status" options={statusOptions} {...register('status')} />
        <Input label="Website" placeholder="https://" error={errors.website?.message} {...register('website')} />
        <Input label="City" {...register('city')} />
        <Input label="Country" {...register('country')} />
        <div className="sm:col-span-2">
          <Input label="Tags" hint="Comma-separated, e.g. enterprise, priority" {...register('tags')} />
        </div>
        <div className="sm:col-span-2">
          <Textarea label="Notes" {...register('notes')} />
        </div>
      </form>
    </Modal>
  );
}
