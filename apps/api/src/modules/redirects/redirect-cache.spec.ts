import { describe, it, expect, beforeEach, vi } from 'vitest';
import { redirectCache, CachedRedirectLink } from './redirect-cache';

describe('RedirectCache (In-Memory LRU)', () => {
  beforeEach(() => {
    redirectCache.clear();
  });

  const mockLink: CachedRedirectLink = {
    id: 'link_123',
    destinationUrl: 'https://example.com/target',
    isActive: true,
    expiresAt: null,
  };

  it('should return undefined on cache miss', () => {
    const result = redirectCache.get('apiref.softics.in', 'missing123');
    expect(result).toBeUndefined();
  });

  it('should store and retrieve a cached redirect', () => {
    redirectCache.set('apiref.softics.in', 'promo2026', mockLink);
    const result = redirectCache.get('apiref.softics.in', 'promo2026');

    expect(result).toBeDefined();
    expect(result?.destinationUrl).toBe('https://example.com/target');
    expect(result?.id).toBe('link_123');
  });

  it('should handle case-insensitivity on host names', () => {
    redirectCache.set('APIREF.SOFTICS.IN', 'myCode', mockLink);
    const result = redirectCache.get('apiref.softics.in', 'myCode');

    expect(result).toBeDefined();
    expect(result?.destinationUrl).toBe('https://example.com/target');
  });

  it('should expire entries when TTL passes', () => {
    vi.useFakeTimers();
    try {
      redirectCache.set('apiref.softics.in', 'shorty', mockLink, 1000); // 1s TTL

      expect(redirectCache.get('apiref.softics.in', 'shorty')).toBeDefined();

      vi.advanceTimersByTime(1500);

      expect(redirectCache.get('apiref.softics.in', 'shorty')).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should invalidate cache by code across all hosts', () => {
    redirectCache.set('apiref.softics.in', 'sharedCode', mockLink);
    redirectCache.set('link.custom.com', 'sharedCode', mockLink);

    expect(redirectCache.get('apiref.softics.in', 'sharedCode')).toBeDefined();
    expect(redirectCache.get('link.custom.com', 'sharedCode')).toBeDefined();

    redirectCache.invalidate('sharedCode');

    expect(redirectCache.get('apiref.softics.in', 'sharedCode')).toBeUndefined();
    expect(redirectCache.get('link.custom.com', 'sharedCode')).toBeUndefined();
  });

  it('should invalidate cache for a specific host and code', () => {
    redirectCache.set('apiref.softics.in', 'multiCode', mockLink);
    redirectCache.set('brand.com', 'multiCode', mockLink);

    redirectCache.invalidate('multiCode', 'brand.com');

    expect(redirectCache.get('apiref.softics.in', 'multiCode')).toBeDefined();
    expect(redirectCache.get('brand.com', 'multiCode')).toBeUndefined();
  });

  it('should store and return null for negative caching (not found short codes)', () => {
    redirectCache.setNotFound('apiref.softics.in', 'ghost123', 15000);
    const result = redirectCache.get('apiref.softics.in', 'ghost123');

    // Negative cache returns null (indicating confirmed 404, not undefined cache miss)
    expect(result).toBeNull();
  });

  it('should expire negative cache entries after short TTL', () => {
    vi.useFakeTimers();
    try {
      redirectCache.setNotFound('apiref.softics.in', 'tempNotFound', 500); // 500ms TTL

      expect(redirectCache.get('apiref.softics.in', 'tempNotFound')).toBeNull();

      vi.advanceTimersByTime(600);

      expect(redirectCache.get('apiref.softics.in', 'tempNotFound')).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should clear negative cache on code invalidation', () => {
    redirectCache.setNotFound('apiref.softics.in', 'soonToBeCreated');
    expect(redirectCache.get('apiref.softics.in', 'soonToBeCreated')).toBeNull();

    // When the link is created, cache is invalidated
    redirectCache.invalidate('soonToBeCreated');

    expect(redirectCache.get('apiref.softics.in', 'soonToBeCreated')).toBeUndefined();
  });
});
