import { promises as dns } from 'dns';
import { logger } from '../../utils/logger';

export interface DnsVerificationResult {
  verified: boolean;
  method?: 'TXT' | 'CNAME';
  detectedTxt?: string[];
  detectedCname?: string[];
  message: string;
}

/**
 * Wraps a DNS query promise in a strict timeout boundary.
 * Prevents hanging customer nameservers or broken DNS delegates from blocking Express worker threads.
 */
function withDnsTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 2500,
  queryType = 'DNS',
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`${queryType} lookup timed out after ${timeoutMs}ms`);
      (error as unknown as { code: string }).code = 'ETIMEDOUT';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Verifies DNS ownership of a custom domain using either TXT challenge or CNAME delegation.
 */
export async function verifyDnsRecords(
  hostname: string,
  verificationToken: string,
  expectedCname = 'cname.urlref.softics.in',
): Promise<DnsVerificationResult> {
  const cleanHost = hostname.trim().toLowerCase();
  const txtChallengeHost = `_urlref-challenge.${cleanHost}`;
  const expectedTxtRecord = `urlref-verification=${verificationToken}`;

  const result: DnsVerificationResult = {
    verified: false,
    detectedTxt: [],
    detectedCname: [],
    message: 'DNS records not yet detected or propagation in progress',
  };

  // 1. Try TXT Challenge verification on _urlref-challenge.<hostname> with 2.5s timeout
  try {
    const txtRecords = await withDnsTimeout(
      dns.resolveTxt(txtChallengeHost),
      2500,
      'TXT',
    );
    // dns.resolveTxt returns string[][]
    const flatTxt = txtRecords.map((chunks) => chunks.join(''));
    result.detectedTxt = flatTxt;

    const matched = flatTxt.some(
      (record) => record.trim() === expectedTxtRecord || record.includes(verificationToken),
    );

    if (matched) {
      result.verified = true;
      result.method = 'TXT';
      result.message = 'Domain ownership successfully verified via DNS TXT challenge record';
      return result;
    }
  } catch (err: unknown) {
    const dnsErr = err as { code?: string };
    if (dnsErr.code === 'ETIMEDOUT') {
      logger.debug({ host: txtChallengeHost }, 'DNS TXT lookup timed out after 2500ms');
    } else if (dnsErr.code !== 'ENODATA' && dnsErr.code !== 'ENOTFOUND') {
      logger.debug({ err, host: txtChallengeHost }, 'DNS TXT lookup diagnostic message');
    }
  }

  // 2. Try CNAME verification on <hostname> with 2.5s timeout
  try {
    const cnameRecords = await withDnsTimeout(
      dns.resolveCname(cleanHost),
      2500,
      'CNAME',
    );
    result.detectedCname = cnameRecords;

    const targetLower = expectedCname.toLowerCase().replace(/\.$/, '');
    const matched = cnameRecords.some((record) => {
      const cleanRecord = record.toLowerCase().replace(/\.$/, '');
      return cleanRecord === targetLower || cleanRecord.endsWith('softics.in');
    });

    if (matched) {
      result.verified = true;
      result.method = 'CNAME';
      result.message = 'Domain routing successfully verified via CNAME alias to proxy target';
      return result;
    }
  } catch (err: unknown) {
    const dnsErr = err as { code?: string };
    if (dnsErr.code === 'ETIMEDOUT') {
      logger.debug({ host: cleanHost }, 'DNS CNAME lookup timed out after 2500ms');
    } else if (dnsErr.code !== 'ENODATA' && dnsErr.code !== 'ENOTFOUND') {
      logger.debug({ err, host: cleanHost }, 'DNS CNAME lookup diagnostic message');
    }
  }

  result.message = `Verification pending. Add a CNAME pointing "${cleanHost}" to "${expectedCname}" OR a TXT record on "${txtChallengeHost}" with value "${expectedTxtRecord}".`;
  return result;
}
