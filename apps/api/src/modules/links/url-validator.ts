import { ValidationError } from '../../errors/app-error';

/**
 * Validates destination URLs against strict security criteria and SSRF protection.
 */
export function validateSafeDestinationUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new ValidationError('Destination URL is required');
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    throw new ValidationError('Destination URL must not exceed 2048 characters');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ValidationError('Invalid destination URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError('Only HTTP and HTTPS protocols are permitted');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject localhost and loopback interfaces
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    throw new ValidationError('Local and loopback destination URLs are prohibited');
  }

  // Reject RFC 1918 private IPv4 subnets and cloud metadata endpoints
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octet1 = parseInt(ipv4Match[1], 10);
    const octet2 = parseInt(ipv4Match[2], 10);

    if (
      octet1 === 10 || // 10.0.0.0/8
      (octet1 === 172 && octet2 >= 16 && octet2 <= 31) || // 172.16.0.0/12
      (octet1 === 192 && octet2 === 168) || // 192.168.0.0/16
      (octet1 === 169 && octet2 === 254) // 169.254.0.0/16 Cloud Metadata & Link-Local
    ) {
      throw new ValidationError('Private, internal, and cloud metadata destinations are prohibited');
    }
  }

  return parsed.toString();
}
