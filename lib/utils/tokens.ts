// Simple token estimation (approximately 4 characters per token for English)
// For more accurate counting, use tiktoken library

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

export function countTokens(text: string): number {
  // For MVP, use estimation. Can be replaced with tiktoken later.
  return estimateTokens(text);
}

export function formatTokenCount(count: number): string {
  if (count < 1000) return count.toString();
  return `${(count / 1000).toFixed(1)}k`;
}
