import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCPF, validateCPF, hashPIN } from '../lib/utils';

describe('Thallium Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format numbers to BRL format', () => {
      const formatted = formatCurrency(1250.5);
      // BRL format has 'R$' and uses comma as decimal separator
      expect(formatted).toContain('R$');
      expect(formatted).toContain('1.250,50');
    });

    it('should return R$ 0,00 for invalid values', () => {
      expect(formatCurrency(NaN)).toBe('R$ 0,00');
    });
  });

  describe('formatCPF', () => {
    it('should format 11 digits raw string to standard CPF formatting', () => {
      const raw = '12345678909';
      expect(formatCPF(raw)).toBe('123.456.789-09');
    });
  });

  describe('validateCPF', () => {
    it('should validate mathematically valid CPFs', () => {
      // 00000000000 is invalid by repeating digits check
      expect(validateCPF('00000000000')).toBe(false);
      
      // Standard valid CPF example
      expect(validateCPF('52998224725')).toBe(true);
    });

    it('should reject CPFs with invalid checksums', () => {
      expect(validateCPF('12345678901')).toBe(false);
    });
  });

  describe('hashPIN', () => {
    it('should hash a 4-digit PIN to a 64-character SHA-256 hex string', async () => {
      const pin = '1234';
      const hash = await hashPIN(pin);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });
});
