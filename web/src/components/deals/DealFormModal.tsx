import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateDeal, useUpdateDeal } from '@/hooks/useDeals';
import { useCustomers } from '@/hooks/useCustomers';
import type { BoardColumn, Deal } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.coerce.number().min(0),
  probability: z.coerce.number().min(0).max(100),
  customerId: z.string().min(1, 'Select a customer'),
  stageId: z.string().min(1),
  expectedCloseDate: z.string().optional(),
  status: z.enum(['OPEN', 'WON', 'LOST']).optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  columns: BoardColumn[];
  defaultStageId?: string;
  /** When provided, the modal edits this deal instead of creating a new one. */
  deal?: Deal | null;
}

export function DealFormModal({ open, onClose, columns, defaultStageId, deal }: Props) {
  const isEdit = !!deal;
  const create = useCreateDeal();
  const update = useUpdateDeal();
  const { data: customers } = useCustomers({ page: 1, limit: 100 });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: deal
      ? {
          title: deal.title,
          value: Number(deal.value),
          probability: deal.probability,
          customerId: deal.customerId,
          stageId: deal.stageId,
          expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : '',
          status: deal.status,
        }
      : {
          title: '', value: 0, probability: 50,
          customerId: '', stageId: defaultStageId ?? columns[0]?.id ?? '',
          expectedCloseDate: '', status: 'OPEN',
        },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (isEdit && deal) {
      // customerId is intentionally omitted — a deal cannot be reassigned to a
      // different customer, matching the backend update contract.
      await update.mutateAsync({
        id: deal.id,
        title: values.title,
        value: values.value,
        probability: values.probability,
        stageId: values.stageId,
        status: values.status,
        expectedCloseDate: values.expectedCloseDate || undefined,
      });
    } else {
      await create.mutateAsync({
        ...values,
        expectedCloseDate: values.expectedCloseDate || undefined,
      });
    }
    reset();
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit deal' : 'New deal'}
      description={isEdit ? 'Update this opportunity.' : 'Add an opportunity to your pipeline.'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={isSubmitting}>{isEdit ? 'Save changes' : 'Create deal'}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Deal title *" error={errors.title?.message} {...register('title')} />
        </div>
        <Select
          label="Customer *"
          placeholder="Select customer…"
          disabled={isEdit}
          error={errors.customerId?.message}
          options={(customers?.items ?? []).map((c) => ({ value: c.id, label: c.company ? `${c.name} · ${c.company}` : c.name }))}
          {...register('customerId')}
        />
        <Select label="Stage" options={columns.map((c) => ({ value: c.id, label: c.name }))} {...register('stageId')} />
        <Input label="Value (USD)" type="number" step="500" error={errors.value?.message} {...register('value')} />
        <Input label="Probability (%)" type="number" min="0" max="100" error={errors.probability?.message} {...register('probability')} />
        {isEdit && (
          <Select
            label="Status"
            options={[
              { value: 'OPEN', label: 'Open' },
              { value: 'WON', label: 'Won' },
              { value: 'LOST', label: 'Lost' },
            ]}
            {...register('status')}
          />
        )}
        <div className="sm:col-span-2">
          <Input label="Expected close date" type="date" {...register('expectedCloseDate')} />
        </div>
      </form>
    </Modal>
  );
}
