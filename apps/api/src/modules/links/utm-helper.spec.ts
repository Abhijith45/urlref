import { describe, it, expect } from 'vitest';
import { appendUtmParameters } from './utm-helper';

describe('UTM Helper', () => {
  it('should return unchanged URL when no UTM parameters are provided', () => {
    const original = 'https://example.com/products/shoes';
    expect(appendUtmParameters(original)).toBe(original);
    expect(appendUtmParameters(original, {})).toBe(original);
  });

  it('should append utm_source, utm_medium, and utm_campaign to a clean URL', () => {
    const original = 'https://example.com/promo';
    const result = appendUtmParameters(original, {
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'summer_sale',
    });

    const parsed = new URL(result);
    expect(parsed.searchParams.get('utm_source')).toBe('google');
    expect(parsed.searchParams.get('utm_medium')).toBe('cpc');
    expect(parsed.searchParams.get('utm_campaign')).toBe('summer_sale');
  });

  it('should preserve existing query parameters and hash fragments', () => {
    const original = 'https://example.com/page?ref=partner&discount=10#details';
    const result = appendUtmParameters(original, {
      utmSource: 'newsletter',
      utmMedium: 'email',
      utmCampaign: 'weekly_digest',
      utmTerm: 'shoes',
      utmContent: 'header_banner',
    });

    const parsed = new URL(result);
    expect(parsed.searchParams.get('ref')).toBe('partner');
    expect(parsed.searchParams.get('discount')).toBe('10');
    expect(parsed.searchParams.get('utm_source')).toBe('newsletter');
    expect(parsed.searchParams.get('utm_medium')).toBe('email');
    expect(parsed.searchParams.get('utm_campaign')).toBe('weekly_digest');
    expect(parsed.searchParams.get('utm_term')).toBe('shoes');
    expect(parsed.searchParams.get('utm_content')).toBe('header_banner');
    expect(parsed.hash).toBe('#details');
  });

  it('should ignore empty or whitespace-only UTM fields', () => {
    const original = 'https://example.com';
    const result = appendUtmParameters(original, {
      utmSource: '  ',
      utmMedium: 'cpc',
      utmCampaign: '',
    });

    const parsed = new URL(result);
    expect(parsed.searchParams.get('utm_source')).toBeNull();
    expect(parsed.searchParams.get('utm_medium')).toBe('cpc');
    expect(parsed.searchParams.get('utm_campaign')).toBeNull();
  });
});
