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
    expect(() => validateSafeDestinationUrl('http://127.0.0.2')).toThrow();
    expect(() => validateSafeDestinationUrl('http://localhost')).toThrow();
    expect(() => validateSafeDestinationUrl('http://localhost:8080/admin')).toThrow();
    expect(() => validateSafeDestinationUrl('http://[::1]')).toThrow();
    expect(() => validateSafeDestinationUrl('http://[::]')).toThrow();
  });

  it('should reject AWS and GCP cloud metadata endpoints (169.254.169.254)', () => {
    expect(() => validateSafeDestinationUrl('http://169.254.169.254/latest/meta-data')).toThrow();
  });

  it('should reject RFC1918 private subnet addresses', () => {
    expect(() => validateSafeDestinationUrl('http://10.0.0.1/status')).toThrow();
    expect(() => validateSafeDestinationUrl('http://172.16.0.1')).toThrow();
    expect(() => validateSafeDestinationUrl('http://192.168.1.1/router-login')).toThrow();
  });

  it('should reject IPv6 Unique Local Addresses (fc00::/7) and Link-Local (fe80::/10)', () => {
    expect(() => validateSafeDestinationUrl('http://[fc00::1]/admin')).toThrow();
    expect(() => validateSafeDestinationUrl('http://[fd12:3456:789a::1]')).toThrow();
    expect(() => validateSafeDestinationUrl('http://[fe80::1ff:fe23:4567]')).toThrow();
  });

  it('should reject IPv4-mapped IPv6 pointing to internal addresses', () => {
    expect(() => validateSafeDestinationUrl('http://[::ffff:127.0.0.1]')).toThrow();
    expect(() => validateSafeDestinationUrl('http://[::ffff:10.0.0.1]')).toThrow();
    expect(() => validateSafeDestinationUrl('http://[::ffff:169.254.169.254]')).toThrow();
  });

  it('should reject internal TLDs (.local, .internal, .localhost)', () => {
    expect(() => validateSafeDestinationUrl('http://server.local')).toThrow();
    expect(() => validateSafeDestinationUrl('http://db.internal:5432')).toThrow();
    expect(() => validateSafeDestinationUrl('http://mytest.localhost')).toThrow();
  });

  it('should reject URLs exceeding max length (2048 characters)', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    expect(() => validateSafeDestinationUrl(longUrl)).toThrow();
  });
});
