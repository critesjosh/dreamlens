'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Mic, BookOpen, Sparkles, ChevronRight, Moon, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDreams } from '@/lib/hooks/useDreams';
import { useSettingsStore } from '@/stores/settingsStore';
import { FRAMEWORKS } from '@/types';

export default function HomePage() {
  const { dreams, isLoading } = useDreams();
  const { theme } = useSettingsStore();

  const recentDreams = dreams.slice(0, 3);
  const totalDreams = dreams.length;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-primary/10 to-background px-4 py-16 text-center">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Animated moon icon with glow */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-full border border-primary/20">
              <Moon className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            DreamLens
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed">
            Unlock the meaning of your dreams through AI-powered analysis across 7 psychological frameworks
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button asChild size="lg" className="h-auto py-6 flex-col gap-2">
            <Link href="/capture">
              <Mic className="h-8 w-8" />
              <span>Record Dream</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-auto py-6 flex-col gap-2"
          >
            <Link href="/dreams">
              <BookOpen className="h-8 w-8" />
              <span>View Journal</span>
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-around text-center">
              <div>
                <p className="text-3xl font-bold">{totalDreams}</p>
                <p className="text-xs text-muted-foreground">
                  Dream{totalDreams !== 1 ? 's' : ''} Recorded
                </p>
              </div>
              <div className="border-l border-border" />
              <div>
                <p className="text-3xl font-bold">7</p>
                <p className="text-xs text-muted-foreground">Frameworks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Dreams */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Dreams</CardTitle>
              {totalDreams > 3 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dreams">View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : recentDreams.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-muted/50 p-3 rounded-full">
                    <Lightbulb className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-muted-foreground mb-2">No dreams recorded yet</p>
                <p className="text-xs text-muted-foreground/70 mb-4 max-w-xs mx-auto">
                  Tip: Keep your phone nearby when you sleep to capture dreams quickly
                </p>
                <Button asChild>
                  <Link href="/capture">
                    <Mic className="h-4 w-4 mr-2" />
                    Record Your First Dream
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDreams.map((dream) => (
                  <Link
                    key={dream.localId}
                    href={`/dreams/${dream.localId}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {dream.title || 'Untitled Dream'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(dream.recordedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Frameworks Preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Interpretation Frameworks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.values(FRAMEWORKS).map((framework) => (
                <Badge key={framework.id} variant="secondary">
                  {framework.shortName}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Analyze your dreams through Jung, Freud, Gestalt, Islamic tradition, Indigenous wisdom, Cognitive Neuroscience, and Existential philosophy.
            </p>
          </CardContent>
        </Card>

        {/* Night Mode Indicator */}
        {theme === 'aggressive-dark' && (
          <Card className="border-primary/50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Night Mode Active</p>
                  <p className="text-xs text-muted-foreground">
                    Optimized for half-awake dream recording
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation Spacer handled by (app) layout */}
    </div>
  );
}
