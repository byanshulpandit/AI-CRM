import { useEffect, useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, KanbanSquare, FileSpreadsheet, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DealCard } from '@/components/deals/DealCard';
import { DealFormModal } from '@/components/deals/DealFormModal';
import { useBoard, useMoveDeal, useDeleteDeal } from '@/hooks/useDeals';
import { downloadExport } from '@/lib/download';
import { formatCompactCurrency, cn } from '@/lib/utils';
import type { BoardColumn, Deal } from '@/types';

export default function DealsPage() {
  const { data: board, isLoading } = useBoard();
  const moveDeal = useMoveDeal();
  const deleteDeal = useDeleteDeal();
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState<string>();
  const [editing, setEditing] = useState<Deal | null>(null);
  const [deleting, setDeleting] = useState<Deal | null>(null);

  const openNew = (stageId?: string) => { setEditing(null); setDefaultStage(stageId); setModalOpen(true); };
  const openEdit = (deal: Deal) => { setEditing(deal); setModalOpen(true); };

  // Keep local board in sync unless the user is mid-drag.
  useEffect(() => {
    if (board && !activeDeal) setColumns(board.columns);
  }, [board, activeDeal]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const findColumn = (id: string): BoardColumn | undefined =>
    columns.find((c) => c.id === id) ?? columns.find((c) => c.deals.some((d) => d.id === id));

  const onDragStart = (e: DragStartEvent) => {
    const deal = columns.flatMap((c) => c.deals).find((d) => d.id === e.active.id);
    setActiveDeal(deal ?? null);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);
    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    setColumns((prev) => {
      const from = prev.find((c) => c.id === activeCol.id)!;
      const to = prev.find((c) => c.id === overCol.id)!;
      const deal = from.deals.find((d) => d.id === active.id);
      if (!deal) return prev;

      const overIsColumn = over.id === overCol.id;
      const overIndex = overIsColumn ? to.deals.length : to.deals.findIndex((d) => d.id === over.id);
      return prev.map((c) => {
        if (c.id === from.id) return { ...c, deals: c.deals.filter((d) => d.id !== active.id) };
        if (c.id === to.id) {
          const next = [...c.deals];
          next.splice(overIndex < 0 ? next.length : overIndex, 0, { ...deal, stageId: to.id });
          return { ...c, deals: next };
        }
        return c;
      });
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const dealId = active.id as string;
    setActiveDeal(null);
    if (!over) return;

    const targetCol = findColumn(over.id as string);
    if (!targetCol) return;

    // Reorder within the destination column.
    let finalColumns = columns;
    const col = columns.find((c) => c.id === targetCol.id)!;
    const oldIndex = col.deals.findIndex((d) => d.id === dealId);
    const overIndex = over.id === col.id ? col.deals.length - 1 : col.deals.findIndex((d) => d.id === over.id);
    if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
      const reordered = arrayMove(col.deals, oldIndex, Math.max(0, overIndex));
      finalColumns = columns.map((c) => (c.id === col.id ? { ...c, deals: reordered } : c));
      setColumns(finalColumns);
    }

    const position = finalColumns.find((c) => c.id === targetCol.id)!.deals.findIndex((d) => d.id === dealId);
    moveDeal.mutate({ id: dealId, stageId: targetCol.id, position: Math.max(0, position) });
  };

  const totalValue = useMemo(
    () => columns.reduce((sum, c) => sum + c.deals.reduce((s, d) => s + Number(d.value), 0), 0),
    [columns],
  );

  if (isLoading) return <FullPageSpinner label="Loading pipeline…" />;
  if (!board?.columns.length) return <EmptyState icon={KanbanSquare} title="No pipeline configured" />;

  return (
    <div>
      <PageHeader
        title="Deal Pipeline"
        description={`${columns.reduce((n, c) => n + c.deals.length, 0)} deals · ${formatCompactCurrency(totalValue)} total value`}
        actions={
          <>
            <Dropdown trigger={<Button variant="outline"><FileSpreadsheet className="h-4 w-4" /> Export</Button>}>
              <DropdownItem icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => downloadExport('deals', 'excel')}>Export as Excel</DropdownItem>
              <DropdownItem icon={<FileText className="h-4 w-4" />} onClick={() => downloadExport('deals', 'pdf')}>Export as PDF</DropdownItem>
            </Dropdown>
            <Button onClick={() => openNew()}><Plus className="h-4 w-4" /> New deal</Button>
          </>
        }
      />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              onAdd={() => openNew(col.id)}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? <div className="w-72 rotate-3"><DealCard deal={activeDeal} /></div> : null}
        </DragOverlay>
      </DndContext>

      <DealFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        columns={columns}
        defaultStageId={defaultStage}
        deal={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete deal"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteDeal.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await deleteDeal.mutateAsync(deleting.id); setDeleting(null); }}
      />
    </div>
  );
}

function KanbanColumn({
  column, onAdd, onEdit, onDelete,
}: {
  column: BoardColumn;
  onAdd: () => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const value = column.deals.reduce((s, d) => s + Number(d.value), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: column.color }} />
          <h3 className="text-sm font-semibold text-foreground">{column.name}</h3>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{column.deals.length}</span>
        </div>
        <button onClick={onAdd} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[24rem] flex-1 flex-col gap-2.5 rounded-2xl border border-dashed border-transparent p-2 transition-colors',
          isOver ? 'border-primary/40 bg-primary/5' : 'bg-muted/20',
        )}
      >
        <SortableContext items={column.deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {column.deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
        {column.deals.length === 0 && (
          <p className="mt-8 text-center text-xs text-muted-foreground">Drop deals here</p>
        )}
      </div>

      <p className="mt-2 px-1 text-xs font-medium text-muted-foreground">{formatCompactCurrency(value)}</p>
    </div>
  );
}
