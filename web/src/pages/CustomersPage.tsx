import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Users, FileSpreadsheet, FileText, MoreVertical, Pencil, Trash2, ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge, customerStatusTone } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { useDebounce } from '@/hooks/useDebounce';
import { downloadExport } from '@/lib/download';
import type { Customer } from '@/types';

const statusFilter = [
  { value: '', label: 'All statuses' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'CHURNED', label: 'Churned' },
];

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const debouncedSearch = useDebounce(search);
  const { data, isLoading } = useCustomers({
    page,
    search: debouncedSearch || undefined,
    status: status || undefined,
  });
  const deleteCustomer = useDeleteCustomer();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setModalOpen(true); };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer relationships."
        actions={
          <>
            <Dropdown
              trigger={<Button variant="outline" size="md"><FileSpreadsheet className="h-4 w-4" /> Export</Button>}
            >
              <DropdownItem icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => downloadExport('customers', 'excel')}>Export as Excel</DropdownItem>
              <DropdownItem icon={<FileText className="h-4 w-4" />} onClick={() => downloadExport('customers', 'pdf')}>Export as PDF</DropdownItem>
            </Dropdown>
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> New customer</Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Search by name, company or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="sm:max-w-sm"
          />
          <Select
            options={statusFilter}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="sm:max-w-[180px]"
          />
        </div>

        {isLoading ? (
          <div className="p-2"><TableSkeleton rows={6} cols={5} /></div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={debouncedSearch || status ? 'Try adjusting your filters.' : 'Create your first customer to get started.'}
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New customer</Button>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pl-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Deals</th>
                    <th className="pb-2 font-medium">Owner</th>
                    <th className="pb-2 pr-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((c) => (
                    <tr key={c.id} className="group transition-colors hover:bg-muted/30">
                      <td className="py-3 pl-2">
                        <Link to={`/app/customers/${c.id}`} className="flex items-center gap-3">
                          <Avatar firstName={c.name.split(' ')[0]} lastName={c.name.split(' ')[1]} src={c.avatarUrl} size="sm" />
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{c.company ?? '—'}</td>
                      <td className="py-3"><Badge tone={customerStatusTone[c.status]}>{c.status}</Badge></td>
                      <td className="py-3 text-muted-foreground">{c._count?.deals ?? 0}</td>
                      <td className="py-3">
                        {c.owner && <Avatar firstName={c.owner.firstName} lastName={c.owner.lastName} src={c.owner.avatarUrl} size="xs" />}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <Dropdown
                          trigger={<button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><MoreVertical className="h-4 w-4" /></button>}
                        >
                          <DropdownItem icon={<ExternalLink className="h-4 w-4" />}><Link to={`/app/customers/${c.id}`}>View details</Link></DropdownItem>
                          <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(c)}>Edit</DropdownItem>
                          <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onClick={() => setDeleting(c)}>Delete</DropdownItem>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {data.items.map((c) => (
                <Link key={c.id} to={`/app/customers/${c.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
                  <Avatar firstName={c.name.split(' ')[0]} lastName={c.name.split(' ')[1]} src={c.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.company ?? c.email}</p>
                  </div>
                  <Badge tone={customerStatusTone[c.status]}>{c.status}</Badge>
                </Link>
              ))}
            </div>

            {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <CustomerFormModal open={modalOpen} onClose={() => setModalOpen(false)} customer={editing} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete customer"
        message={`Delete "${deleting?.name}"? This also removes their deals, notes and activity. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteCustomer.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await deleteCustomer.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
