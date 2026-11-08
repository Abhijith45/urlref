import { describe, it, expect } from 'vitest';
import { validateCustomAlias } from './alias-validator';

describe('Custom Alias Validator', () => {
  it('should allow valid alphanumeric aliases, hyphens, and underscores', () => {
    expect(() => validateCustomAlias('promo-2026')).not.toThrow();
    expect(() => validateCustomAlias('my_link')).not.toThrow();
    expect(() => validateCustomAlias('launchV2')).not.toThrow();
    expect(() => validateCustomAlias('abc')).not.toThrow();
  });

  it('should reject aliases shorter than 3 characters', () => {
    expect(() => validateCustomAlias('a')).toThrow();
    expect(() => validateCustomAlias('ab')).toThrow();
  });

  it('should reject aliases longer than 32 characters', () => {
    const tooLong = 'a'.repeat(33);
    expect(() => validateCustomAlias(tooLong)).toThrow();
  });

  it('should reject aliases with special symbols or whitespace', () => {
    expect(() => validateCustomAlias('link with space')).toThrow();
    expect(() => validateCustomAlias('link@promo')).toThrow();
    expect(() => validateCustomAlias('promo#2026')).toThrow();
    expect(() => validateCustomAlias('test!url')).toThrow();
  });

  it('should reject reserved system routes and keywords', () => {
    expect(() => validateCustomAlias('health')).toThrow();
    expect(() => validateCustomAlias('ready')).toThrow();
    expect(() => validateCustomAlias('api')).toThrow();
    expect(() => validateCustomAlias('auth')).toThrow();
    expect(() => validateCustomAlias('login')).toThrow();
    expect(() => validateCustomAlias('register')).toThrow();
    expect(() => validateCustomAlias('admin')).toThrow();
    expect(() => validateCustomAlias('links')).toThrow();
    expect(() => validateCustomAlias('analytics')).toThrow();
  });
});
