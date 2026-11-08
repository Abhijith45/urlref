export interface CachedRedirectLink {
  id: string;
  destinationUrl: string;
  isActive: boolean;
  expiresAt: Date | null;
  custom404Url?: string | null;
}

interface CacheEntry {
  link: CachedRedirectLink | null;
  expiresAtMs: number;
}

/**
 * Thread-safe, in-memory LRU redirect cache for high-throughput sub-millisecond redirects.
 * Bounded to 10,000 entries with a default 5-minute TTL.
 */
class RedirectCache {
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(maxEntries = 10000, defaultTtlMs = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
  }

  private makeKey(host: string, code: string): string {
    return `${host.trim().toLowerCase()}:${code.trim()}`;
  }

  public get(host: string, code: string): CachedRedirectLink | null | undefined {
    const key = this.makeKey(host, code);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check TTL expiration
    if (Date.now() > entry.expiresAtMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU order (delete and re-insert)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.link;
  }

  public set(
    host: string,
    code: string,
    link: CachedRedirectLink,
    ttlMs: number = this.defaultTtlMs,
  ): void {
    const key = this.makeKey(host, code);

    // Evict oldest item if capacity is reached
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      link,
      expiresAtMs: Date.now() + ttlMs,
    });
  }

  /**
   * Negative caching: store non-existent short codes for a short duration (default 15s)
   * to absorb bot scans, brute force attempts, and crawler bursts at the memory layer.
   */
  public setNotFound(host: string, code: string, ttlMs = 15000): void {
    const key = this.makeKey(host, code);

    // Evict oldest item if capacity is reached
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      link: null,
      expiresAtMs: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate a specific code or all domain variants for a code.
   */
  public invalidate(code: string, host?: string): void {
    const cleanCode = code.trim();
    if (host) {
      this.cache.delete(this.makeKey(host, cleanCode));
      return;
    }

    // If no host specified, evict all host entries matching this code
    const suffix = `:${cleanCode}`;
    for (const key of this.cache.keys()) {
      if (key.endsWith(suffix)) {
        this.cache.delete(key);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const redirectCache = new RedirectCache();
