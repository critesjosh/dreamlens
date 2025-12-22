'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Tip {
  icon?: LucideIcon;
  text: string;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tips?: Tip[];
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tips,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {/* Icon with subtle background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
        <div className="relative bg-muted/50 p-4 rounded-full border border-border">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      </div>

      {/* Title and description */}
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>

      {/* Tips section */}
      {tips && tips.length > 0 && (
        <div className="w-full max-w-sm mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quick Tips
          </p>
          <ul className="space-y-2 text-left">
            {tips.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                {tip.icon ? (
                  <tip.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                ) : (
                  <span className="h-4 w-4 flex items-center justify-center text-primary shrink-0">
                    {index + 1}.
                  </span>
                )}
                <span>{tip.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action button */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
