import { estimateTokens, countTokens, formatTokenCount } from '../tokens';

describe('Token Utilities', () => {
  describe('estimateTokens', () => {
    it('should return 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should return 0 for null/undefined', () => {
      expect(estimateTokens(null as any)).toBe(0);
      expect(estimateTokens(undefined as any)).toBe(0);
    });

    it('should estimate tokens correctly for short text', () => {
      const text = 'hello'; // 5 characters = ~1.25 tokens, rounded up to 2
      expect(estimateTokens(text)).toBe(2);
    });

    it('should estimate tokens correctly for longer text', () => {
      const text = 'This is a longer text for token estimation.'; // 44 chars = 11 tokens
      expect(estimateTokens(text)).toBe(11);
    });

    it('should round up partial tokens', () => {
      const text = 'hi'; // 2 characters = 0.5 tokens, rounded up to 1
      expect(estimateTokens(text)).toBe(1);
    });
  });

  describe('countTokens', () => {
    it('should use estimateTokens for counting', () => {
      const text = 'Test text';
      expect(countTokens(text)).toBe(estimateTokens(text));
    });
  });

  describe('formatTokenCount', () => {
    it('should format small numbers as-is', () => {
      expect(formatTokenCount(0)).toBe('0');
      expect(formatTokenCount(100)).toBe('100');
      expect(formatTokenCount(999)).toBe('999');
    });

    it('should format thousands with k suffix', () => {
      expect(formatTokenCount(1000)).toBe('1.0k');
      expect(formatTokenCount(1500)).toBe('1.5k');
      expect(formatTokenCount(2345)).toBe('2.3k');
    });

    it('should format large numbers correctly', () => {
      expect(formatTokenCount(10000)).toBe('10.0k');
      expect(formatTokenCount(128000)).toBe('128.0k');
    });
  });
});
