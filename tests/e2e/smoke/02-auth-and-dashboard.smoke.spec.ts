import { test, expect } from '@playwright/test';
import { createIsolatedTestUser, authenticateBrowserContext } from '../fixtures/test-helpers';

test.describe('Smoke 02: Authentication & Protected Dashboard Routing', () => {
  test('should redirect unauthenticated visitor from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should authenticate isolated user and load dashboard overview with metric cards', async ({
    context,
    page,
    request,
  }) => {
    // 1. Provision isolated test user via API
    const user = await createIsolatedTestUser(request);

    // 2. Inject session cookie into browser context
    await authenticateBrowserContext(context, user.sidCookie);

    // 3. Visit /dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // 4. Verify dashboard headers and layout
    await expect(page.getByRole('heading', { name: /dashboard overview/i })).toBeVisible();
    await expect(page.getByText(/total links/i).first()).toBeVisible();
    await expect(page.getByText(/total clicks/i).first()).toBeVisible();

    // 5. Verify navigation sidebar items
    await expect(page.getByRole('button', { name: /^links$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^qr studio$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^analytics$/i })).toBeVisible();
  });
});
