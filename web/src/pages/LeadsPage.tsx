import { useState } from 'react';
import {
  Plus, Target, MoreVertical, Pencil, Trash2, ArrowRightLeft, FileSpreadsheet, FileText, Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge, leadStatusTone, leadRatingTone } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LeadFormModal } from '@/components/leads/LeadFormModal';
import { useLeads, useDeleteLead, useConvertLead } from '@/hooks/useLeads';
import { useScoreLead } from '@/hooks/useAi';
import { downloadExport } from '@/lib/download';
import { formatCurrency } from '@/lib/utils';
import type { Lead } from '@/types';

const statusFilter = [{ value: '', label: 'All statuses' }, ...['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'].map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }))];

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);

  const { data, isLoading } = useLeads({ page, status: status || undefined });
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();
  const scoreLead = useScoreLead();

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Track and qualify inbound and outbound leads."
        actions={
          <>
            <Dropdown trigger={<Button variant="outline"><FileSpreadsheet className="h-4 w-4" /> Export</Button>}>
              <DropdownItem icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => downloadExport('leads', 'excel')}>Export as Excel</DropdownItem>
              <DropdownItem icon={<FileText className="h-4 w-4" />} onClick={() => downloadExport('leads', 'pdf')}>Export as PDF</DropdownItem>
            </Dropdown>
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> New lead</Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="mb-4">
          <Select options={statusFilter} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:max-w-[200px]" />
        </div>

        {isLoading ? (
          <div className="p-2"><TableSkeleton rows={6} cols={5} /></div>
        ) : !data?.items.length ? (
          <EmptyState icon={Target} title="No leads found" action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> New lead</Button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pl-2 font-medium">Lead</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Value</th>
                    <th className="pb-2 font-medium">AI score</th>
                    <th className="pb-2 font-medium">Owner</th>
                    <th className="pb-2 pr-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-muted/30">
                      <td className="py-3 pl-2">
                        <p className="font-medium text-foreground">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{l.contactName ?? l.contactEmail ?? '—'}</p>
                      </td>
                      <td className="py-3"><Badge tone={leadStatusTone[l.status]}>{l.status}</Badge></td>
                      <td className="py-3 capitalize text-muted-foreground">{l.source.replace('_', ' ').toLowerCase()}</td>
                      <td className="py-3 font-medium text-foreground">{formatCurrency(Number(l.value))}</td>
                      <td className="py-3">
                        {l.score != null ? (
                          <span className="flex items-center gap-1.5" title={l.scoreReason ?? undefined}>
                            <Badge tone={leadRatingTone[l.scoreRating ?? 'COLD']}>{l.score}</Badge>
                            <span className="text-xs text-muted-foreground">{l.scoreRating}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">{l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : '—'}</td>
                      <td className="py-3 pr-2 text-right">
                        <Dropdown trigger={<button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><MoreVertical className="h-4 w-4" /></button>}>
                          <DropdownItem icon={<Sparkles className="h-4 w-4" />} onClick={() => scoreLead.mutate(l.id)}>Score with AI</DropdownItem>
                          <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { setEditing(l); setModalOpen(true); }}>Edit</DropdownItem>
                          {l.status !== 'CONVERTED' && (
                            <DropdownItem icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => convertLead.mutate(l.id)}>Convert to customer</DropdownItem>
                          )}
                          <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onClick={() => setDeleting(l)}>Delete</DropdownItem>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} lead={editing} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete lead"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLead.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await deleteLead.mutateAsync(deleting.id); setDeleting(null); }}
      />
    </div>
  );
}
