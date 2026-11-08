import { ValidationError } from '../../errors/app-error';

/**
 * Validates destination URLs against strict security criteria and SSRF protection.
 * Protects against IPv4 private subnets, cloud metadata endpoints, IPv6 Unique Local Addresses,
 * IPv6 link-local addresses, IPv4-mapped IPv6, and internal network TLDs.
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

  const rawHostname = parsed.hostname.toLowerCase();
  // Strip IPv6 bracket notation: "[::1]" -> "::1"
  const hostname = rawHostname.replace(/^\[|\]$/g, '');

  // 1. Reject localhost, loopback interfaces, and internal domain names
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '::' ||
    hostname === '0:0:0:0:0:0:0:1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new ValidationError('Local, loopback, and internal destination URLs are prohibited');
  }

  // 2. Reject IPv6 Unique Local Addresses (fc00::/7) and Link-Local (fe80::/10)
  if (/^f[cd][0-9a-f]{2}:/i.test(hostname) || /^fe[89ab][0-9a-f]:/i.test(hostname)) {
    throw new ValidationError('Private and link-local IPv6 destination URLs are prohibited');
  }

  // 3. Reject IPv4-mapped IPv6 addresses (::ffff:0:0/96) which can bypass IPv4 filters
  if (hostname.startsWith('::ffff:') || hostname.startsWith('ffff:')) {
    throw new ValidationError('IPv4-mapped IPv6 destination URLs are prohibited');
  }

  // 4. Resolve IPv4 subnets
  const ipv4Target = hostname;

  const ipv4Match = ipv4Target.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octet1 = parseInt(ipv4Match[1], 10);
    const octet2 = parseInt(ipv4Match[2], 10);
    const octet3 = parseInt(ipv4Match[3], 10);
    const octet4 = parseInt(ipv4Match[4], 10);

    // Validate octet ranges
    if ([octet1, octet2, octet3, octet4].some((o) => o < 0 || o > 255)) {
      throw new ValidationError('Invalid IP address octets in destination URL');
    }

    if (
      octet1 === 127 || // 127.0.0.0/8 Loopback
      octet1 === 0 || // 0.0.0.0/8 Current Network
      octet1 === 10 || // 10.0.0.0/8 Private Network
      (octet1 === 172 && octet2 >= 16 && octet2 <= 31) || // 172.16.0.0/12 Private Network
      (octet1 === 192 && octet2 === 168) || // 192.168.0.0/16 Private Network
      (octet1 === 169 && octet2 === 254) || // 169.254.0.0/16 Link-Local / AWS/GCP Metadata
      (octet1 === 100 && octet2 >= 64 && octet2 <= 127) || // 100.64.0.0/10 Carrier-Grade NAT
      (octet1 >= 224 && octet1 <= 239) || // 224.0.0.0/4 Multicast
      octet1 === 255 // 255.255.255.255 Broadcast
    ) {
      throw new ValidationError('Private, internal, and cloud metadata destinations are prohibited');
    }
  }

  return parsed.toString();
}
