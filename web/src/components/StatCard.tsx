import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  delta?: { value: string; positive: boolean };
  hint?: string;
}

const tones = {
  primary: 'from-primary/20 to-accent/10 text-primary',
  success: 'from-success/20 to-emerald-500/10 text-success',
  warning: 'from-warning/20 to-amber-500/10 text-warning',
  danger: 'from-danger/20 to-rose-500/10 text-danger',
  info: 'from-sky-500/20 to-blue-500/10 text-sky-500',
};

export function StatCard({ label, value, icon: Icon, tone = 'primary', delta, hint }: StatCardProps) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(delta || hint) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {delta && (
            <span className={cn('inline-flex items-center gap-1 font-medium', delta.positive ? 'text-success' : 'text-danger')}>
              {delta.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {delta.value}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
