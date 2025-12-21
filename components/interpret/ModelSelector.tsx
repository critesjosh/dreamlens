'use client';

import { MODELS, type ProviderId } from '@/types';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  provider: ProviderId;
  model: string;
  onModelChange: (model: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ModelSelector({
  provider,
  model,
  onModelChange,
  className,
  disabled = false,
}: ModelSelectorProps) {
  // Filter models by provider
  const availableModels = MODELS.filter((m) => m.provider === provider);

  const options = availableModels.map((m) => ({
    value: m.id,
    label: `${m.name} (${formatCost(m)})`,
  }));

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">AI Model</label>
      <Select
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        options={options}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        {getModelDescription(model)}
      </p>
    </div>
  );
}

function formatCost(model: (typeof MODELS)[number]): string {
  const avgCost = (model.inputCostPer1kTokens + model.outputCostPer1kTokens) / 2;
  if (avgCost < 0.001) return '<$0.001/1k';
  return `$${avgCost.toFixed(3)}/1k`;
}

function getModelDescription(modelId: string): string {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return '';

  if (modelId.includes('mini') || modelId.includes('flash') || modelId.includes('haiku')) {
    return 'Fast and cost-effective for most dreams';
  }
  if (modelId.includes('opus') || modelId === 'gpt-4-turbo') {
    return 'Most capable, best for complex dream analysis';
  }
  return 'Balanced performance and cost';
}
