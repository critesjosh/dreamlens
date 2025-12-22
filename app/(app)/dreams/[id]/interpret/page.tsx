'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton, SkeletonCard, SkeletonInterpretation } from '@/components/ui/Skeleton';
import { FrameworkSelector } from '@/components/interpret/FrameworkSelector';
import { ModelSelector } from '@/components/interpret/ModelSelector';
import { InterpretationPanel } from '@/components/interpret/InterpretationPanel';
import { FollowUpChat } from '@/components/interpret/FollowUpChat';
import { useDream } from '@/lib/hooks/useDreams';
import { useInterpret } from '@/lib/hooks/useInterpret';
import { useSettingsStore } from '@/stores/settingsStore';
import { use } from 'react';
import type { FrameworkId } from '@/types';

interface InterpretPageProps {
  params: Promise<{ id: string }>;
}

export default function InterpretPage({ params }: InterpretPageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const viewId = searchParams.get('view');
  const { dream, isLoading: isDreamLoading } = useDream(id);
  const { defaultFramework, defaultModel } = useSettingsStore();

  const [selectedFramework, setSelectedFramework] =
    useState<FrameworkId>(defaultFramework);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [currentInterpretationIndex, setCurrentInterpretationIndex] = useState(0);

  const {
    interpret,
    followUp,
    loadConversation,
    interpretations,
    isInterpreting,
    streamingContent,
    error,
    hasApiKey,
    conversationHistory,
  } = useInterpret({
    dreamLocalId: id,
    dreamContent: dream?.content ?? '',
    dreamTitle: dream?.title,
    tags: dream?.tags ?? [],
  });

  // Set initial index based on viewId query param
  useEffect(() => {
    if (viewId && interpretations.length > 0) {
      const index = interpretations.findIndex((i) => i.localId === viewId);
      if (index !== -1) {
        setCurrentInterpretationIndex(index);
      }
    }
  }, [viewId, interpretations]);

  const currentInterpretation = interpretations[currentInterpretationIndex];

  // Load conversation when interpretation changes
  useEffect(() => {
    if (currentInterpretation) {
      loadConversation(currentInterpretation.localId, currentInterpretation.content);
    }
  }, [currentInterpretation?.localId, loadConversation]);

  const handleInterpret = async () => {
    const result = await interpret(selectedFramework, selectedModel);
    if (result) {
      // Show the newest interpretation
      setCurrentInterpretationIndex(0);
    }
  };

  if (isDreamLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton variant="text" className="w-16" />
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="text" className="w-16" />
        </div>

        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-32 h-6" />
            <Skeleton variant="text" className="w-48 h-3" />
          </div>
        </div>

        {/* Dream preview skeleton */}
        <SkeletonCard />

        {/* Framework selector skeleton */}
        <div className="space-y-3">
          <Skeleton variant="text" className="w-32 h-4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>

        {/* Button skeleton */}
        <Skeleton className="h-12 w-full rounded-md" />

        {/* Interpretation skeleton */}
        <SkeletonInterpretation />
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6 text-center">
        <h1 className="text-xl font-bold mb-4">Dream not found</h1>
        <Button asChild>
          <Link href="/dreams">Back to Dreams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dreams', href: '/dreams' },
          { label: dream.title || 'Untitled Dream', href: `/dreams/${id}` },
          { label: 'Interpret' },
        ]}
      />

      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/dreams/${id}`} aria-label="Back to dream">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Interpret Dream</h1>
          <p className="text-sm text-muted-foreground truncate">
            {dream.title || 'Untitled Dream'}
          </p>
        </div>
      </header>

      {/* API Key Warning */}
      {!hasApiKey && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">
                Please add your OpenAI API key in Settings to interpret dreams
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dream Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Dream Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm line-clamp-3">{dream.content}</p>
        </CardContent>
      </Card>

      {/* Framework Selection */}
      <FrameworkSelector
        value={selectedFramework}
        onChange={setSelectedFramework}
      />

      {/* Model Selection */}
      <ModelSelector
        provider="openai"
        model={selectedModel}
        onModelChange={setSelectedModel}
        disabled={!hasApiKey}
      />

      {/* Interpret Button */}
      <Button
        onClick={handleInterpret}
        disabled={!hasApiKey || isInterpreting}
        className="w-full"
        size="lg"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        {isInterpreting ? 'Interpreting...' : 'Interpret Dream'}
      </Button>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Interpretation Result */}
      <InterpretationPanel
        interpretation={currentInterpretation}
        streamingContent={streamingContent}
        isLoading={isInterpreting && !currentInterpretation}
        isInterpreting={isInterpreting}
        selectedFramework={selectedFramework}
      />

      {/* Previous Interpretations */}
      {interpretations.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Previous Interpretations ({interpretations.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {interpretations.map((interp, index) => (
              <Button
                key={interp.localId}
                variant={index === currentInterpretationIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentInterpretationIndex(index)}
              >
                {interp.framework}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Chat Thread */}
      {currentInterpretation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Continue the Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat History - skip first message (original interpretation shown above) */}
            {conversationHistory.length > 1 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversationHistory.slice(1).map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {/* Streaming response */}
                {isInterpreting && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-muted">
                      <p className="whitespace-pre-wrap">{streamingContent}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <FollowUpChat
              onSendMessage={(msg) => {
                followUp(
                  msg,
                  selectedFramework,
                  selectedModel,
                  currentInterpretation?.content,
                  currentInterpretation?.localId
                );
              }}
              isLoading={isInterpreting}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
