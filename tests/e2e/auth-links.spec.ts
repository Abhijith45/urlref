import { test, expect } from '@playwright/test';

test.describe('URLRef Full User Journey & Dashboard Workflow', () => {
  const testEmail = `e2e_${Date.now()}@softics.in`;
  const testPassword = 'Password123!';

  test('should display landing page, allow anonymous URL shortening, and switch to QR studio', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /shorten, brand and track links in milliseconds/i })).toBeVisible();

    // 2. Shorten an anonymous URL
    await page.getByPlaceholder(/paste your long link here/i).fill('https://news.ycombinator.com');
    await page.getByRole('button', { name: /shorten link/i }).click();

    // 3. Verify Rebrandly-style conversion card appears
    await expect(page.getByText(/here is your shortened and trackable link/i)).toBeVisible();
    await expect(page.getByText(/here are more things you can do in urlref/i)).toBeVisible();

    // 4. Switch to QR Studio via header/tab
    await page.getByRole('button', { name: /qr studio/i }).first().click();
    await expect(page.getByRole('heading', { name: /design branded dynamic qr codes in seconds/i })).toBeVisible();
    await expect(page.getByText(/qr preview inactive/i)).toBeVisible();
  });

  test('should allow a user to register, view dashboard, create a link, and inspect domains', async ({ page }) => {
    // 1. Visit Register Page
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

    // 2. Fill registration form
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    // 3. User should be redirected to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard overview/i })).toBeVisible();

    // 4. Quick shorten a URL on dashboard
    const destination = 'https://developer.mozilla.org';
    await page.getByPlaceholder(/paste long destination url/i).fill(destination);
    await page.getByRole('button', { name: /shorten/i }).click();

    // 5. Verify short URL created box is shown
    await expect(page.getByText(/newly shortened url:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /copy/i })).toBeVisible();

    // 6. Navigate to Custom Domains page
    await page.goto('/dashboard/domains');
    await expect(page.getByRole('heading', { name: /custom branded domains/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /connect domain/i })).toBeVisible();
  });
});
