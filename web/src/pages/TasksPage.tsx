import { useState } from 'react';
import { Plus, CheckSquare, Circle, CircleDot, CheckCircle2, Trash2, Calendar } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge, priorityTone } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

const columns: { status: TaskStatus; label: string; icon: typeof Circle }[] = [
  { status: 'TODO', label: 'To do', icon: Circle },
  { status: 'IN_PROGRESS', label: 'In progress', icon: CircleDot },
  { status: 'DONE', label: 'Done', icon: CheckCircle2 },
];

const nextStatus: Record<TaskStatus, TaskStatus> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
};

export default function TasksPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canSeeAll = role === 'ADMIN' || role === 'SALES_MANAGER';
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const { data, isLoading } = useTasks({ page: 1, scope });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const submit = async () => {
    if (!title.trim()) return;
    await createTask.mutateAsync({ title: title.trim(), priority: priority as Task['priority'] });
    setTitle('');
  };

  const grouped = (status: TaskStatus) => data?.items.filter((t) => t.status === status) ?? [];

  return (
    <div>
      <PageHeader
        title="Tasks & Reminders"
        description="Stay on top of your follow-ups and to-dos."
        actions={
          canSeeAll ? (
            <Select
              options={[{ value: 'mine', label: 'My tasks' }, { value: 'all', label: 'All tasks' }]}
              value={scope}
              onChange={(e) => setScope(e.target.value as 'mine' | 'all')}
              className="w-40"
            />
          ) : undefined
        }
      />

      {/* Quick add */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="flex-1"
          />
          <Select
            options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }]}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="sm:w-36"
          />
          <Button onClick={submit} loading={createTask.isPending}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
      ) : !data?.items.length ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Add your first task above." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((col) => {
            const items = grouped(col.status);
            return (
              <div key={col.status}>
                <div className="mb-3 flex items-center gap-2 px-1">
                  <col.icon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => {
                    const overdue = t.dueDate && t.status !== 'DONE' && isPast(new Date(t.dueDate));
                    return (
                      <div key={t.id} className="group card-surface p-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => updateTask.mutate({ id: t.id, status: nextStatus[t.status] })}
                            className="mt-0.5 text-muted-foreground transition-colors hover:text-primary"
                            title="Cycle status"
                          >
                            {t.status === 'DONE' ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-sm font-medium text-foreground', t.status === 'DONE' && 'line-through opacity-60')}>{t.title}</p>
                            {t.customer && <p className="text-xs text-muted-foreground">{t.customer.name}</p>}
                            <div className="mt-1.5 flex items-center gap-2">
                              <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                              {t.dueDate && (
                                <span className={cn('inline-flex items-center gap-1 text-xs', overdue ? 'text-danger' : 'text-muted-foreground')}>
                                  <Calendar className="h-3 w-3" /> {format(new Date(t.dueDate), 'MMM d')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => deleteTask.mutate(t.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">Nothing here</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
