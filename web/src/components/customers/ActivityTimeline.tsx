import {
  StickyNote, Phone, Mail, Users, RefreshCw, Paperclip, DollarSign, CheckSquare, Bot,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Activity, ActivityType } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';

const iconMap: Record<ActivityType, typeof StickyNote> = {
  NOTE: StickyNote,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Users,
  STATUS_CHANGE: RefreshCw,
  FILE: Paperclip,
  DEAL_UPDATE: DollarSign,
  TASK: CheckSquare,
  AI_INSIGHT: Bot,
};

const toneMap: Record<ActivityType, string> = {
  NOTE: 'bg-amber-500/15 text-amber-500',
  CALL: 'bg-sky-500/15 text-sky-500',
  EMAIL: 'bg-primary/15 text-primary',
  MEETING: 'bg-violet-500/15 text-violet-500',
  STATUS_CHANGE: 'bg-muted text-muted-foreground',
  FILE: 'bg-emerald-500/15 text-emerald-500',
  DEAL_UPDATE: 'bg-success/15 text-success',
  TASK: 'bg-blue-500/15 text-blue-500',
  AI_INSIGHT: 'bg-accent/15 text-accent',
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return <EmptyState icon={RefreshCw} title="No activity yet" description="Interactions with this customer will appear here." />;
  }
  return (
    <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
      {activities.map((a) => {
        const Icon = iconMap[a.type] ?? StickyNote;
        return (
          <li key={a.id} className="relative flex gap-3 pl-0">
            <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background ${toneMap[a.type]}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 pt-1">
              <p className="text-sm text-foreground">{a.summary}</p>
              <p className="text-xs text-muted-foreground">
                {a.user ? `${a.user.firstName} ${a.user.lastName} · ` : ''}
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
