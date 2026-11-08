import { test, expect } from '@playwright/test';
import { createIsolatedTestUser } from '../fixtures/test-helpers';

test.describe('Smoke 04: Public Sub-millisecond 302 Redirect Engine', () => {
  test('should return HTTP 302 Found with pre-compiled UTM destination URL', async ({ request }) => {
    // 1. Create user and authenticated link with UTM parameters
    const user = await createIsolatedTestUser(request);
    const customAlias = `smk_${Date.now()}`;
    const destination = 'https://news.ycombinator.com';

    const createLinkRes = await request.post('http://localhost:5000/api/v1/links', {
      headers: {
        Cookie: `sid=${user.sidCookie}`,
      },
      data: {
        destinationUrl: destination,
        customAlias,
        utmSource: 'newsletter',
        utmMedium: 'email',
        utmCampaign: 'smoke2026',
      },
    });

    expect(createLinkRes.status()).toBe(201);
    const linkData = (await createLinkRes.json()).data;
    expect(linkData.code).toBe(customAlias);

    // 2. Query the public redirect endpoint directly (disable automatic redirect following)
    const redirectRes = await request.get(`http://localhost:5000/${customAlias}`, {
      maxRedirects: 0,
    });

    // 3. Verify HTTP 302 Found and Location header
    expect(redirectRes.status()).toBe(302);
    const location = redirectRes.headers()['location'];
    expect(location).toContain('news.ycombinator.com');
    expect(location).toContain('utm_source=newsletter');
    expect(location).toContain('utm_medium=email');
    expect(location).toContain('utm_campaign=smoke2026');
  });

  test('should return HTTP 404 Not Found for non-existent short code', async ({ request }) => {
    const invalidRes = await request.get('http://localhost:5000/non_existent_code_xyz99', {
      maxRedirects: 0,
    });
    expect(invalidRes.status()).toBe(404);
  });
});
