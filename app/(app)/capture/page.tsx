'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { QuickTagSelector } from '@/components/capture/QuickTagSelector';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCaptureStore } from '@/stores/captureStore';
import { useDreams } from '@/lib/hooks/useDreams';

export default function CapturePage() {
  const router = useRouter();
  const { addDream } = useDreams();

  const {
    content,
    tags,
    title,
    setContent,
    addTag,
    removeTag,
    setTitle,
    reset,
  } = useCaptureStore();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      const dream = await addDream({
        title: title || undefined,
        content,
        recordedAt: new Date(),
        tags,
      });

      reset();
      router.push(`/dreams/${dream.localId}`);
    } catch (error) {
      console.error('Failed to save dream:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (content || tags.length > 0) {
      if (confirm('Are you sure you want to discard this dream?')) {
        reset();
      }
    } else {
      reset();
    }
  };

  const canSave = content.trim().length > 0;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Record Dream</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Write down your dream while it&apos;s still fresh
        </p>
      </header>

      {/* Title Input */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title (optional)
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your dream a title..."
        />
      </div>

      {/* Dream Content */}
      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          Dream Content
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your dream in as much detail as you can remember..."
          className="min-h-[200px] resize-y"
        />
      </div>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickTagSelector
            selectedTags={tags}
            onAddTag={addTag}
            onRemoveTag={removeTag}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleDiscard}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Discard
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={!canSave || isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Dream'}
        </Button>
      </div>
    </div>
  );
}
