import { test, expect } from '@playwright/test';

test.describe('URL Shortener Full User Journey & Landing Page', () => {
  const testEmail = `e2e_${Date.now()}@softics.in`;
  const testPassword = 'Password123!';

  test('should display landing page and allow anonymous URL shortening', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /shorten, share & track/i })).toBeVisible();

    // 2. Shorten an anonymous URL
    await page.getByPlaceholder(/paste your long url here/i).fill('https://news.ycombinator.com');
    await page.getByRole('button', { name: /shorten url/i }).click();

    // 3. Verify result preview is visible
    await expect(page.getByText(/your shortened url/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /qr code/i })).toBeVisible();
  });

  test('should allow a user to register, create a link, and view dashboard', async ({ page }) => {
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

    // 6. Navigate to Links page
    await page.getByRole('button', { name: /view all links/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/links/);
    await expect(page.getByRole('heading', { name: /my links/i })).toBeVisible();

    // 7. Verify the new link appears in the table
    await expect(page.getByText(destination)).toBeVisible();
  });
});
