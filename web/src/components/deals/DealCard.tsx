import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Building2, Pencil, Trophy, XCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, dealStatusTone } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useUpdateDeal } from '@/hooks/useDeals';
import { formatCompactCurrency, cn } from '@/lib/utils';
import type { Deal } from '@/types';

interface DealCardProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
}

/** A draggable/sortable deal card for the Kanban board. */
export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'deal', stageId: deal.stageId },
  });
  const update = useUpdateDeal();

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group card-surface cursor-grab touch-none rounded-xl p-3 active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">{deal.title}</p>
        {(onEdit || onDelete) && (
          // Stop the pointer from reaching the drag sensor so the menu is clickable.
          <div className="shrink-0" onPointerDown={(e) => e.stopPropagation()}>
            <Dropdown
              trigger={
                <button className="rounded-lg p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
            >
              {onEdit && (
                <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(deal)}>Edit</DropdownItem>
              )}
              {deal.status !== 'WON' && (
                <DropdownItem icon={<Trophy className="h-4 w-4" />} onClick={() => update.mutate({ id: deal.id, status: 'WON' })}>Mark won</DropdownItem>
              )}
              {deal.status !== 'LOST' && (
                <DropdownItem icon={<XCircle className="h-4 w-4" />} onClick={() => update.mutate({ id: deal.id, status: 'LOST' })}>Mark lost</DropdownItem>
              )}
              {deal.status !== 'OPEN' && (
                <DropdownItem icon={<RotateCcw className="h-4 w-4" />} onClick={() => update.mutate({ id: deal.id, status: 'OPEN' })}>Reopen</DropdownItem>
              )}
              {onDelete && (
                <DropdownItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(deal)}>Delete</DropdownItem>
              )}
            </Dropdown>
          </div>
        )}
      </div>

      {deal.customer && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span className="truncate">{deal.customer.company ?? deal.customer.name}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {formatCompactCurrency(Number(deal.value), deal.currency)}
        </span>
        {deal.status !== 'OPEN' ? (
          <Badge tone={dealStatusTone[deal.status]}>{deal.status}</Badge>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${deal.probability}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{deal.probability}%</span>
          </div>
        )}
      </div>

      {deal.owner && (
        <div className="mt-2 flex justify-end">
          <Avatar firstName={deal.owner.firstName} lastName={deal.owner.lastName} src={deal.owner.avatarUrl} size="xs" />
        </div>
      )}
    </div>
  );
}
