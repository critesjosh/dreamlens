import { calculateCost, estimateCost, formatCost, formatCostRange } from '../cost';

describe('Cost Utilities', () => {
  describe('calculateCost', () => {
    it('should return 0 for unknown model', () => {
      expect(calculateCost('unknown-model', 1000, 1000)).toBe(0);
    });

    it('should calculate cost correctly for GPT-4o Mini', () => {
      // GPT-4o Mini: $0.00015 input, $0.0006 output per 1k tokens
      const cost = calculateCost('gpt-4o-mini', 1000, 500);
      expect(cost).toBeCloseTo(0.00015 + 0.0003, 5); // 0.00045
    });

    it('should calculate cost correctly for GPT-4o', () => {
      // GPT-4o: $0.005 input, $0.015 output per 1k tokens
      const cost = calculateCost('gpt-4o', 2000, 1000);
      expect(cost).toBeCloseTo(0.01 + 0.015, 5); // 0.025
    });

    it('should handle zero tokens', () => {
      expect(calculateCost('gpt-4o-mini', 0, 0)).toBe(0);
    });

    it('should handle large token counts', () => {
      const cost = calculateCost('gpt-4o', 100000, 50000);
      expect(cost).toBeCloseTo(0.5 + 0.75, 5); // 1.25
    });
  });

  describe('estimateCost', () => {
    it('should use default output token count of 500', () => {
      const estimated = estimateCost('gpt-4o-mini', 1000);
      const calculated = calculateCost('gpt-4o-mini', 1000, 500);
      expect(estimated).toBe(calculated);
    });

    it('should allow custom output token estimation', () => {
      const estimated = estimateCost('gpt-4o-mini', 1000, 1000);
      const calculated = calculateCost('gpt-4o-mini', 1000, 1000);
      expect(estimated).toBe(calculated);
    });
  });

  describe('formatCost', () => {
    it('should format very small costs in cents', () => {
      expect(formatCost(0.001)).toBe('$0.10¢');
      expect(formatCost(0.005)).toBe('$0.50¢');
      expect(formatCost(0.0099)).toBe('$0.99¢');
    });

    it('should format costs >= $0.01 in dollars', () => {
      expect(formatCost(0.01)).toBe('$0.0100');
      expect(formatCost(0.025)).toBe('$0.0250');
      expect(formatCost(1.2345)).toBe('$1.2345');
    });

    it('should handle zero cost', () => {
      expect(formatCost(0)).toBe('$0.00¢');
    });
  });

  describe('formatCostRange', () => {
    it('should format a range of costs', () => {
      expect(formatCostRange(0.001, 0.01)).toBe('$0.10¢ - $0.0100');
      expect(formatCostRange(0.01, 0.05)).toBe('$0.0100 - $0.0500');
    });

    it('should handle same min and max', () => {
      expect(formatCostRange(0.025, 0.025)).toBe('$0.0250 - $0.0250');
    });
  });
});
