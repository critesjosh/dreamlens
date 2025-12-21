'use client';

import { format } from 'date-fns';
import { FRAMEWORKS, type FrameworkId } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { formatCost } from '@/lib/utils/cost';
import type { LocalInterpretation } from '@/lib/db/local';

interface InterpretationPanelProps {
  interpretation?: LocalInterpretation;
  streamingContent?: string;
  isLoading?: boolean;
  isInterpreting?: boolean;
  selectedFramework?: FrameworkId;
  className?: string;
}

export function InterpretationPanel({
  interpretation,
  streamingContent,
  isLoading,
  isInterpreting,
  selectedFramework,
  className,
}: InterpretationPanelProps) {
  // Show streaming content when actively interpreting a new dream (not follow-ups)
  // Otherwise show saved interpretation content
  const showStreaming = isInterpreting && streamingContent;
  const content = showStreaming ? streamingContent : interpretation?.content;
  // Use selected framework when streaming, otherwise use saved interpretation's framework
  const framework = showStreaming ? selectedFramework : (interpretation?.framework as FrameworkId | undefined);
  const frameworkInfo = framework ? FRAMEWORKS[framework] : null;

  if (!content && !isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-12 text-center text-muted-foreground">
          Select a framework and click &quot;Interpret&quot; to analyze your dream
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {frameworkInfo && (
              <Badge variant="secondary">{frameworkInfo.shortName}</Badge>
            )}
            {interpretation && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(interpretation.createdAt), 'MMM d, h:mm a')}
              </span>
            )}
          </div>
          {interpretation?.costUsd !== undefined && (
            <span className="text-xs text-muted-foreground">
              {formatCost(interpretation.costUsd)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(isLoading || isInterpreting) && !content ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Interpreting your dream...</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed">
              {content}
              {(isLoading || showStreaming) && (
                <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-0.5" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
