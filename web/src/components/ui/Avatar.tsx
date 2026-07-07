import { cn, getInitials, avatarGradient } from '@/lib/utils';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function Avatar({ firstName, lastName, src, size = 'md', className }: AvatarProps) {
  const seed = `${firstName ?? ''}${lastName ?? ''}` || 'user';
  if (src) {
    return (
      <img
        src={src}
        alt={seed}
        className={cn('rounded-full object-cover ring-2 ring-border', sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white/10',
        avatarGradient(seed),
        sizes[size],
        className,
      )}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
