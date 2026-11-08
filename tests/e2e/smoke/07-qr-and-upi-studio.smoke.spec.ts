import { test, expect } from '@playwright/test';
import { createIsolatedTestUser, authenticateBrowserContext } from '../fixtures/test-helpers';

test.describe('Smoke 07: Dynamic QR Studio & Multi-Channel Generator', () => {
  test('should load QR Studio, switch to UPI Pay channel, and verify live canvas preview', async ({
    context,
    page,
    request,
  }) => {
    // 1. Authenticate user
    const user = await createIsolatedTestUser(request);
    await authenticateBrowserContext(context, user.sidCookie);

    // 2. Navigate to /dashboard/qr
    await page.goto('/dashboard/qr');
    await expect(page.getByRole('heading', { name: /qr studio/i })).toBeVisible();

    // 3. Switch to UPI Pay channel tab
    const upiTab = page.getByRole('tab', { name: /upi pay/i });
    await upiTab.click();

    // 4. Fill UPI VPA and amount
    await page.getByLabel(/upi id/i).fill('agency@upi');
    await page.getByLabel(/payee name/i).fill('Agency Corp');
    await page.getByLabel(/amount/i).fill('100');

    // 5. Verify Target payload updates and canvas renders
    await expect(page.getByText(/upi:\/\/pay\?pa=agency(%40|@)upi/i)).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();

    // 6. Verify export format selectors and Download button is enabled
    await expect(page.getByRole('button', { name: /download/i })).toBeEnabled();
  });
});
