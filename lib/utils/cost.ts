import { MODELS } from '@/types';

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1000) * model.inputCostPer1kTokens;
  const outputCost = (outputTokens / 1000) * model.outputCostPer1kTokens;

  return inputCost + outputCost;
}

export function estimateCost(
  modelId: string,
  inputTokens: number,
  estimatedOutputTokens: number = 500
): number {
  return calculateCost(modelId, inputTokens, estimatedOutputTokens);
}

export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${(costUsd * 100).toFixed(2)}¢`;
  }
  return `$${costUsd.toFixed(4)}`;
}

export function formatCostRange(minCost: number, maxCost: number): string {
  return `${formatCost(minCost)} - ${formatCost(maxCost)}`;
}
