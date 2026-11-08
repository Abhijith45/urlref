import { describe, it, expect } from 'vitest';
import { AnalyticsRetentionService } from './analytics-retention.service';

describe('AnalyticsRetentionService', () => {
  describe('sanitizeCsvCell', () => {
    it('should wrap standard strings in quotes', () => {
      expect(AnalyticsRetentionService.sanitizeCsvCell('direct')).toBe('"direct"');
      expect(AnalyticsRetentionService.sanitizeCsvCell('https://example.com')).toBe('"https://example.com"');
    });

    it('should neutralize formula trigger characters (CWE-1236)', () => {
      expect(AnalyticsRetentionService.sanitizeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
      expect(AnalyticsRetentionService.sanitizeCsvCell('+cmd|')).toBe('"\'+cmd|"');
      expect(AnalyticsRetentionService.sanitizeCsvCell('-5+2')).toBe('"\'-5+2"');
      expect(AnalyticsRetentionService.sanitizeCsvCell('@mention')).toBe('"\'@mention"');
    });

    it('should escape internal double quotes correctly', () => {
      expect(AnalyticsRetentionService.sanitizeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
    });

    it('should handle null and undefined safely', () => {
      expect(AnalyticsRetentionService.sanitizeCsvCell(null)).toBe('""');
      expect(AnalyticsRetentionService.sanitizeCsvCell(undefined)).toBe('""');
    });
  });

  describe('buildCsvReport', () => {
    it('should generate valid RFC 4180 CSV rows with headers', () => {
      const now = new Date('2026-11-08T12:00:00.000Z');
      const csv = AnalyticsRetentionService.buildCsvReport([
        {
          clickedAt: now,
          link: {
            code: 'promo1',
            destinationUrl: 'https://example.com/shoes',
          },
          referrer: 'google.com',
          deviceType: 'mobile',
          countryCode: 'IN',
        },
      ]);

      const lines = csv.split('\r\n');
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('Clicked At (UTC),Link Code,Destination URL,Referrer,Device Type,Country Code');
      expect(lines[1]).toContain('"2026-11-08T12:00:00.000Z"');
      expect(lines[1]).toContain('"promo1"');
      expect(lines[1]).toContain('"IN"');
    });
  });
});
