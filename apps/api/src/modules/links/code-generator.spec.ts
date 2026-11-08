import { describe, it, expect } from 'vitest';
import { generateShortCode } from './code-generator';
import { BASE62_ALPHABET, DEFAULT_SHORT_CODE_LENGTH } from '@shortener/shared';

describe('Base62 Short Code Generator', () => {
  it('should generate a code with the default length of 7', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(DEFAULT_SHORT_CODE_LENGTH);
    expect(code).toHaveLength(7);
  });

  it('should generate a code with custom specified length', () => {
    const code = generateShortCode(10);
    expect(code).toHaveLength(10);
  });

  it('should only contain valid characters from the Base62 alphabet', () => {
    const validCharSet = new Set(BASE62_ALPHABET.split(''));
    for (let i = 0; i < 100; i++) {
      const code = generateShortCode();
      for (const char of code) {
        expect(validCharSet.has(char)).toBe(true);
      }
    }
  });

  it('should exhibit cryptographically secure entropy with zero duplicates in a batch', () => {
    const generated = new Set<string>();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const code = generateShortCode();
      expect(generated.has(code)).toBe(false);
      generated.add(code);
    }
    expect(generated.size).toBe(count);
  });
});
