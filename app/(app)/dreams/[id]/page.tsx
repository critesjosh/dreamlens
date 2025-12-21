'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Sparkles,
  Edit2,
  Trash2,
  Save,
  X,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { QuickTagSelector } from '@/components/capture/QuickTagSelector';
import { useDream } from '@/lib/hooks/useDreams';
import { getInterpretationsForDream } from '@/lib/db/local';
import { use } from 'react';
import { FRAMEWORKS } from '@/types';
import type { Tag } from '@/types';

interface DreamPageProps {
  params: Promise<{ id: string }>;
}

export default function DreamPage({ params }: DreamPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { dream, isLoading, update, remove } = useDream(id);
  const interpretations = useLiveQuery(
    () => getInterpretationsForDream(id),
    [id]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<Tag[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-40 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
        </div>
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

  const startEditing = () => {
    setEditTitle(dream.title || '');
    setEditContent(dream.content);
    setEditTags([...dream.tags]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEdits = async () => {
    await update({
      title: editTitle || undefined,
      content: editContent,
      tags: editTags,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this dream? This cannot be undone.')) {
      setIsDeleting(true);
      await remove();
      router.push('/dreams');
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dreams">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Dream title..."
              className="text-xl font-bold"
            />
          ) : (
            <h1 className="text-xl font-bold">
              {dream.title || 'Untitled Dream'}
            </h1>
          )}
          <p className="text-sm text-muted-foreground">
            {format(new Date(dream.recordedAt), 'PPP p')}
          </p>
        </div>
      </header>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dream Content</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[200px]"
            />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">
              {dream.content}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <QuickTagSelector
              selectedTags={editTags}
              onAddTag={(tag) => setEditTags([...editTags, tag])}
              onRemoveTag={(category, value) =>
                setEditTags(
                  editTags.filter(
                    (t) => !(t.category === category && t.value === value)
                  )
                )
              }
            />
          ) : dream.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {dream.tags.map((tag) => (
                <Badge
                  key={`${tag.category}-${tag.value}`}
                  variant={tag.category as 'emotion' | 'theme' | 'person' | 'place' | 'object' | 'action' | 'custom'}
                >
                  {tag.value}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No tags added</p>
          )}
        </CardContent>
      </Card>

      {/* Interpretations */}
      {!isEditing && interpretations && interpretations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Interpretations ({interpretations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {interpretations.map((interp) => (
              <Link
                key={interp.localId}
                href={`/dreams/${id}/interpret?view=${interp.localId}`}
                className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {FRAMEWORKS[interp.framework].shortName}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {interp.model}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(interp.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {interp.content.substring(0, 150)}...
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isEditing ? (
          <>
            <Button variant="outline" className="flex-1" onClick={cancelEditing}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button className="flex-1" onClick={saveEdits}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" className="flex-1" onClick={startEditing}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button className="flex-1" asChild>
              <Link href={`/dreams/${id}/interpret`}>
                <Sparkles className="h-4 w-4 mr-2" />
                Interpret
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
