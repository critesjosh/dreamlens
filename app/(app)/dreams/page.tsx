'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen, ChevronRight, Mic, Moon, Sparkles, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonDreamCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDreams } from '@/lib/hooks/useDreams';

export default function DreamsPage() {
  const { dreams, isLoading } = useDreams();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dream Journal</h1>
        </header>
        <div className="space-y-3">
          <SkeletonDreamCard />
          <SkeletonDreamCard />
          <SkeletonDreamCard />
        </div>
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Dream Journal</h1>
        </header>

        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={BookOpen}
              title="Your dream journal awaits"
              description="Start capturing your dreams to unlock insights through AI-powered interpretation."
              tips={[
                {
                  icon: Moon,
                  text: 'Record dreams immediately after waking for best recall',
                },
                {
                  icon: Clock,
                  text: 'Use Night Mode for half-awake recording (Settings)',
                },
                {
                  icon: Sparkles,
                  text: 'Get interpretations from 7 psychological frameworks',
                },
              ]}
              action={
                <Button asChild size="lg">
                  <Link href="/capture">
                    <Mic className="h-4 w-4 mr-2" />
                    Record Your First Dream
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dream Journal</h1>
        <span className="text-muted-foreground text-sm">
          {dreams.length} dream{dreams.length !== 1 ? 's' : ''}
        </span>
      </header>

      <div className="space-y-3">
        {dreams.map((dream) => (
          <Link key={dream.localId} href={`/dreams/${dream.localId}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title and date */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">
                        {dream.title || 'Untitled Dream'}
                      </h3>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatDistanceToNow(new Date(dream.recordedAt), {
                        addSuffix: true,
                      })}
                    </p>

                    {/* Content preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dream.content}
                    </p>

                    {/* Tags */}
                    {dream.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dream.tags.slice(0, 4).map((tag) => (
                          <Badge
                            key={`${tag.category}-${tag.value}`}
                            variant={tag.category as 'emotion' | 'theme' | 'person' | 'place' | 'object' | 'action' | 'custom'}
                            className="text-xs"
                          >
                            {tag.value}
                          </Badge>
                        ))}
                        {dream.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{dream.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
