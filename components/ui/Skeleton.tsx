import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text';
}

export function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'default' && 'rounded-md',
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
      </div>
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-5/6" />
    </div>
  );
}

export function SkeletonDreamCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-2/3 h-5" />
          <Skeleton variant="text" className="w-1/4 h-3" />
          <Skeleton variant="text" className="w-full mt-2" />
          <Skeleton variant="text" className="w-4/5" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-5 shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonInterpretation({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
        <Skeleton variant="text" className="w-12 h-3" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-11/12" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-48 h-6" />
          <Skeleton variant="text" className="w-32 h-3" />
        </div>
      </div>

      {/* Content skeleton */}
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
