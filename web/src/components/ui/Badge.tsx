import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-sky-500/15 text-sky-500',
  muted: 'bg-muted/60 text-muted-foreground',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = 'default', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// Status → tone maps used across the app.
export const customerStatusTone: Record<string, Tone> = {
  LEAD: 'info', ACTIVE: 'success', INACTIVE: 'muted', CHURNED: 'danger',
};
export const leadStatusTone: Record<string, Tone> = {
  NEW: 'info', CONTACTED: 'primary', QUALIFIED: 'success', UNQUALIFIED: 'danger', CONVERTED: 'success',
};
export const dealStatusTone: Record<string, Tone> = {
  OPEN: 'primary', WON: 'success', LOST: 'danger',
};
export const priorityTone: Record<string, Tone> = {
  LOW: 'muted', MEDIUM: 'warning', HIGH: 'danger',
};
export const taskStatusTone: Record<string, Tone> = {
  TODO: 'muted', IN_PROGRESS: 'primary', DONE: 'success',
};
export const leadRatingTone: Record<string, Tone> = {
  HOT: 'danger', WARM: 'warning', COLD: 'info',
};
