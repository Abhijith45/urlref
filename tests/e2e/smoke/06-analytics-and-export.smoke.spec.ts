import { test, expect } from '@playwright/test';
import { createIsolatedTestUser, authenticateBrowserContext } from '../fixtures/test-helpers';

test.describe('Smoke 06: Analytics Dashboard, 30-Day Retention & CSV Export', () => {
  test('should display 30-day retention badge and export dashboard analytics CSV', async ({
    context,
    page,
    request,
  }) => {
    // 1. Authenticate user
    const user = await createIsolatedTestUser(request);
    await authenticateBrowserContext(context, user.sidCookie);

    // 2. Navigate to /dashboard/analytics
    await page.goto('/dashboard/analytics');

    // 3. Verify headline and 30-day retention badge
    await expect(page.getByRole('heading', { name: /overall analytics/i })).toBeVisible();
    await expect(page.getByText(/30-day retention active/i)).toBeVisible();

    // 4. Trigger portfolio CSV export
    const [exportDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export csv \(30d\)/i }).click(),
    ]);

    expect(exportDownload.suggestedFilename()).toBe('urlref_dashboard_analytics_30d.csv');
  });

  test('should display link-specific analytics and export link report CSV', async ({
    context,
    page,
    request,
  }) => {
    // 1. Authenticate user and create a link
    const user = await createIsolatedTestUser(request);
    await authenticateBrowserContext(context, user.sidCookie);

    const createLinkRes = await request.post('http://localhost:5000/api/v1/links', {
      headers: {
        Cookie: `sid=${user.sidCookie}`,
      },
      data: {
        destinationUrl: 'https://news.ycombinator.com',
        customAlias: `rep_${Date.now()}`,
      },
    });
    const link = (await createLinkRes.json()).data;

    // 2. Navigate directly to link analytics page
    await page.goto(`/dashboard/analytics/${link.id}`);

    // 3. Verify link analytics header and retention chip
    await expect(page.getByRole('heading', { name: new RegExp(`link analytics: /${link.code}`, 'i') })).toBeVisible();
    await expect(page.getByText(/30-day retention/i)).toBeVisible();

    // 4. Trigger link-specific CSV report export
    const [linkExportDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export csv \(30d\)/i }).click(),
    ]);

    expect(linkExportDownload.suggestedFilename()).toBe(`urlref_${link.code}_analytics_30d.csv`);
  });
});
