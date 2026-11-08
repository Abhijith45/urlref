import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyDnsRecords } from './dns-verifier';
import { promises as dns } from 'dns';

vi.mock('dns', () => ({
  promises: {
    resolveTxt: vi.fn(),
    resolveCname: vi.fn(),
  },
}));

describe('verifyDnsRecords (Resilient DNS Verifier)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify ownership when TXT challenge record matches', async () => {
    vi.mocked(dns.resolveTxt).mockResolvedValueOnce([['urlref-verification=token_abc123']]);

    const result = await verifyDnsRecords('links.mybrand.com', 'token_abc123');

    expect(result.verified).toBe(true);
    expect(result.method).toBe('TXT');
    expect(result.message).toContain('successfully verified via DNS TXT challenge');
    expect(dns.resolveTxt).toHaveBeenCalledWith('_urlref-challenge.links.mybrand.com');
  });

  it('should verify ownership when CNAME matches expected proxy host', async () => {
    vi.mocked(dns.resolveTxt).mockRejectedValueOnce({ code: 'ENODATA' });
    vi.mocked(dns.resolveCname).mockResolvedValueOnce(['cname.urlref.softics.in']);

    const result = await verifyDnsRecords('go.mybrand.com', 'token_xyz789');

    expect(result.verified).toBe(true);
    expect(result.method).toBe('CNAME');
    expect(result.message).toContain('successfully verified via CNAME');
  });

  it('should handle DNS query timeouts gracefully without hanging or throwing', async () => {
    // Simulate a hung DNS resolver that takes 10 seconds
    vi.mocked(dns.resolveTxt).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve([['slow']]), 10000)),
    );
    vi.mocked(dns.resolveCname).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(['slow.softics.in']), 10000)),
    );

    // Using real timers with a short timeout by passing mock or testing with advanceTimers
    vi.useFakeTimers();
    try {
      const promise = verifyDnsRecords('hanging.mybrand.com', 'token_timeout');
      
      // Advance past both TXT (2500ms) and CNAME (2500ms) timeouts
      await vi.advanceTimersByTimeAsync(6000);

      const result = await promise;
      expect(result.verified).toBe(false);
      expect(result.message).toContain('Verification pending');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should return pending status when records are missing (ENOTFOUND)', async () => {
    vi.mocked(dns.resolveTxt).mockRejectedValueOnce({ code: 'ENOTFOUND' });
    vi.mocked(dns.resolveCname).mockRejectedValueOnce({ code: 'ENOTFOUND' });

    const result = await verifyDnsRecords('unconfigured.com', 'token_123');

    expect(result.verified).toBe(false);
    expect(result.message).toContain('Verification pending');
  });
});
