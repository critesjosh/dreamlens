'use client';

import { FRAMEWORKS, type FrameworkId } from '@/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Orbit,
  Brain,
  Puzzle,
  Moon,
  Leaf,
  Activity,
  Compass,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Orbit,
  Brain,
  Puzzle,
  Moon,
  Leaf,
  Activity,
  Compass,
};

// Static color classes to ensure Tailwind includes them in the build
const colorClasses: Record<string, { bg: string; hover: string }> = {
  purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700' },
  red: { bg: 'bg-red-600', hover: 'hover:bg-red-700' },
  green: { bg: 'bg-green-600', hover: 'hover:bg-green-700' },
  emerald: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
  amber: { bg: 'bg-amber-600', hover: 'hover:bg-amber-700' },
  blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700' },
  slate: { bg: 'bg-slate-600', hover: 'hover:bg-slate-700' },
};

interface FrameworkSelectorProps {
  value: FrameworkId;
  onChange: (framework: FrameworkId) => void;
  className?: string;
}

export function FrameworkSelector({
  value,
  onChange,
  className,
}: FrameworkSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium">Interpretation Framework</label>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(FRAMEWORKS) as FrameworkId[]).map((frameworkId) => {
          const framework = FRAMEWORKS[frameworkId];
          const Icon = iconMap[framework.icon];
          const isSelected = value === frameworkId;
          const colors = colorClasses[framework.color];

          return (
            <Button
              key={frameworkId}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'h-auto py-3 px-3 flex flex-col items-start gap-1 text-left min-w-0',
                isSelected && colors && `${colors.bg} ${colors.hover}`
              )}
              onClick={() => onChange(frameworkId)}
            >
              <div className="flex items-center gap-2 w-full">
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                <span className="font-medium truncate">{framework.shortName}</span>
              </div>
              <span className="text-xs opacity-80 w-full truncate">
                {framework.description}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
