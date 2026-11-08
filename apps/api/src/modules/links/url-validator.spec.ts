import { describe, it, expect } from 'vitest';
import { validateSafeDestinationUrl } from './url-validator';

describe('Destination URL & SSRF Validator', () => {
  it('should accept valid public HTTP and HTTPS URLs', () => {
    expect(() => validateSafeDestinationUrl('https://example.com')).not.toThrow();
    expect(() => validateSafeDestinationUrl('http://subdomain.domain.org/path/resource?query=1&b=2')).not.toThrow();
    expect(() => validateSafeDestinationUrl('https://github.com/nodejs/node')).not.toThrow();
  });

  it('should reject non-HTTP/HTTPS protocols', () => {
    expect(() => validateSafeDestinationUrl('javascript:alert(1)')).toThrow();
    expect(() => validateSafeDestinationUrl('file:///etc/passwd')).toThrow();
    expect(() => validateSafeDestinationUrl('ftp://example.com/files')).toThrow();
    expect(() => validateSafeDestinationUrl('data:text/html,<script>alert(1)</script>')).toThrow();
  });

  it('should reject loopback addresses (127.0.0.1, localhost, ::1) to prevent SSRF', () => {
    expect(() => validateSafeDestinationUrl('http://127.0.0.1')).toThrow();
    expect(() => validateSafeDestinationUrl('http://localhost')).toThrow();
    expect(() => validateSafeDestinationUrl('http://localhost:8080/admin')).toThrow();
  });

  it('should reject AWS cloud metadata endpoints (169.254.169.254)', () => {
    expect(() => validateSafeDestinationUrl('http://169.254.169.254/latest/meta-data')).toThrow();
  });

  it('should reject RFC1918 private subnet addresses', () => {
    expect(() => validateSafeDestinationUrl('http://10.0.0.1/status')).toThrow();
    expect(() => validateSafeDestinationUrl('http://172.16.0.1')).toThrow();
    expect(() => validateSafeDestinationUrl('http://192.168.1.1/router-login')).toThrow();
  });

  it('should reject URLs exceeding max length (2048 characters)', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    expect(() => validateSafeDestinationUrl(longUrl)).toThrow();
  });
});
