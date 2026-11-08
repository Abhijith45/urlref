import { test, expect } from '@playwright/test';
import { createIsolatedTestUser, authenticateBrowserContext } from '../fixtures/test-helpers';

test.describe('Smoke 03: Link Creation & UTM Campaign Builder', () => {
  test('should create a short link with UTM parameters and verify live preview', async ({
    context,
    page,
    request,
  }) => {
    // 1. Authenticate user
    const user = await createIsolatedTestUser(request);
    await authenticateBrowserContext(context, user.sidCookie);

    // 2. Navigate to /dashboard/links
    await page.goto('/dashboard/links');
    await expect(page.getByRole('heading', { name: /my links/i })).toBeVisible();

    // 3. Open Create Link Modal
    await page.getByRole('button', { name: /create short link/i }).click();
    await expect(page.getByRole('heading', { name: /create new short link/i })).toBeVisible();

    // 4. Fill Destination URL & Title
    const destinationUrl = 'https://news.ycombinator.com/best';
    await page.getByLabel(/destination url/i).fill(destinationUrl);
    await page.getByLabel(/title \/ campaign note/i).fill('Smoke Campaign 2026');

    // 5. Expand UTM Campaign Builder
    const utmAccordion = page.getByText(/utm campaign builder/i);
    await utmAccordion.click();

    // 6. Enter UTM parameters
    await page.getByLabel(/campaign source/i).fill('playwright');
    await page.getByLabel(/campaign medium/i).fill('smoke');
    await page.getByLabel(/campaign name/i).fill('e2e_run');

    // 7. Verify live preview URL contains all UTM tags
    await expect(
      page.getByText(/news\.ycombinator\.com\/best\?utm_source=playwright&utm_medium=smoke&utm_campaign=e2e_run/i),
    ).toBeVisible();

    // 8. Submit form
    await page.getByRole('button', { name: /^create link$/i }).click();

    // 9. Confirm modal closes and link row is rendered in the Links table
    await expect(page.getByRole('heading', { name: /create new short link/i })).not.toBeVisible();
    await expect(page.getByText(/news\.ycombinator\.com\/best\?utm_source=playwright/i).first()).toBeVisible();
  });
});
