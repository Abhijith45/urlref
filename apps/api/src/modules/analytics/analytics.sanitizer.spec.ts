import { describe, it, expect } from 'vitest';
import { sanitizeReferrer, classifyDeviceType, sanitizeCountryCode } from './analytics.sanitizer';

describe('Analytics Privacy Sanitizer', () => {
  describe('sanitizeReferrer', () => {
    it('should strip paths, queries, and credentials to retain only the clean domain', () => {
      expect(sanitizeReferrer('https://twitter.com/user/status/12345?s=20&t=xyz')).toBe('twitter.com');
      expect(sanitizeReferrer('http://sub.example.org:8080/deep/path?ref=track#frag')).toBe('sub.example.org');
    });

    it('should return "direct" for direct or empty referrers', () => {
      expect(sanitizeReferrer(undefined)).toBe('direct');
      expect(sanitizeReferrer('')).toBe('direct');
    });

    it('should return "direct" for malformed or invalid URLs', () => {
      expect(sanitizeReferrer('not-a-valid-url')).toBe('direct');
    });
  });

  describe('classifyDeviceType', () => {
    it('should identify mobile user agents', () => {
      const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
      const androidMobileUA = 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 Mobile Safari/537.36';
      expect(classifyDeviceType(iPhoneUA)).toBe('mobile');
      expect(classifyDeviceType(androidMobileUA)).toBe('mobile');
    });

    it('should identify tablet user agents', () => {
      const iPadUA = 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15';
      expect(classifyDeviceType(iPadUA)).toBe('tablet');
    });

    it('should default to desktop for standard desktop browsers', () => {
      const chromeDesktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
      expect(classifyDeviceType(chromeDesktopUA)).toBe('desktop');
    });

    it('should default to desktop when user-agent header is absent', () => {
      expect(classifyDeviceType(undefined)).toBe('desktop');
    });
  });

  describe('sanitizeCountryCode', () => {
    it('should accept valid 2-letter ISO country codes in uppercase', () => {
      expect(sanitizeCountryCode('US')).toBe('US');
      expect(sanitizeCountryCode('in')).toBe('IN');
      expect(sanitizeCountryCode('GB')).toBe('GB');
      expect(sanitizeCountryCode('de')).toBe('DE');
    });

    it('should return null for invalid or non-2-letter strings', () => {
      expect(sanitizeCountryCode('USA')).toBeNull();
      expect(sanitizeCountryCode('12')).toBeNull();
      expect(sanitizeCountryCode(undefined)).toBeNull();
    });
  });
});
