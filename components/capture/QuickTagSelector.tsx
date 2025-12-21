'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { Tag, TagCategory, PRESET_TAGS } from '@/types';

interface QuickTagSelectorProps {
  selectedTags: Tag[];
  onAddTag: (tag: Tag) => void;
  onRemoveTag: (category: string, value: string) => void;
  className?: string;
}

const CATEGORY_LABELS: Record<TagCategory, string> = {
  emotion: 'Emotions',
  theme: 'Themes',
  person: 'People',
  place: 'Places',
  object: 'Objects',
  action: 'Actions',
  custom: 'Custom',
};

export function QuickTagSelector({
  selectedTags,
  onAddTag,
  onRemoveTag,
  className,
}: QuickTagSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TagCategory>('emotion');
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const categories = Object.keys(PRESET_TAGS).filter(
    (cat) => cat !== 'custom'
  ) as TagCategory[];

  const isTagSelected = (category: TagCategory, value: string) =>
    selectedTags.some((t) => t.category === category && t.value === value);

  const handleTagClick = (category: TagCategory, value: string) => {
    if (isTagSelected(category, value)) {
      onRemoveTag(category, value);
    } else {
      onAddTag({ category, value });
    }
  };

  const handleAddCustomTag = () => {
    const value = customTagInput.trim().toLowerCase();
    if (value && !isTagSelected('custom', value)) {
      onAddTag({ category: 'custom', value });
      setCustomTagInput('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={`${tag.category}-${tag.value}`}
              variant={tag.category as 'emotion' | 'theme' | 'person' | 'place' | 'object' | 'action' | 'custom'}
              className="flex items-center gap-1 pr-1"
            >
              {tag.value}
              <button
                onClick={() => onRemoveTag(tag.category, tag.value)}
                className="ml-1 rounded-full hover:bg-foreground/10 p-0.5"
                aria-label={`Remove ${tag.value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveCategory(category)}
            className="shrink-0"
          >
            {CATEGORY_LABELS[category]}
          </Button>
        ))}
      </div>

      {/* Preset tags for active category */}
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS[activeCategory].map((value) => (
          <Badge
            key={value}
            variant={isTagSelected(activeCategory, value) ? activeCategory : 'outline'}
            className={cn(
              'cursor-pointer transition-colors',
              isTagSelected(activeCategory, value)
                ? ''
                : 'hover:bg-secondary'
            )}
            onClick={() => handleTagClick(activeCategory, value)}
          >
            {value}
          </Badge>
        ))}
      </div>

      {/* Custom tag input */}
      <div className="pt-2 border-t border-border">
        {showCustomInput ? (
          <div className="flex gap-2">
            <Input
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              placeholder="Enter custom tag..."
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomTag();
                }
                if (e.key === 'Escape') {
                  setShowCustomInput(false);
                  setCustomTagInput('');
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleAddCustomTag}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCustomInput(false);
                setCustomTagInput('');
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add custom tag
          </Button>
        )}
      </div>
    </div>
  );
}
