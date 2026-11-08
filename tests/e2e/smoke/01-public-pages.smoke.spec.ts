import { test, expect } from '@playwright/test';

test.describe('Smoke 01: Public Landing Pages, Tools & Anonymous Shortener', () => {
  test('should load landing page, perform anonymous URL shortening, and switch modes', async ({ page }) => {
    await page.goto('/');

    // 1. Verify primary headline
    await expect(
      page.getByRole('heading', { name: /shorten, brand and track links with dynamic qr codes/i }),
    ).toBeVisible();

    // 2. Perform anonymous URL shortening
    const longUrl = 'https://news.ycombinator.com';
    const input = page.getByPlaceholder(/paste your long link here/i);
    await input.fill(longUrl);
    await page.getByRole('button', { name: /shorten link/i }).click();

    // 3. Verify shortened result card appears with copy action and redirect snippet
    await expect(page.getByText(/redirects to: https:\/\/news\.ycombinator\.com/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /copy link/i })).toBeVisible();

    // 4. Switch to QR Studio via header/hero toggle
    const qrStudioButton = page.getByRole('button', { name: /qr studio/i }).first();
    await qrStudioButton.click();
    await expect(page.getByRole('tab', { name: /upi pay/i })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should load Agency Solution landing page with key value props', async ({ page }) => {
    await page.goto('/solutions/agencies');
    await expect(
      page.getByRole('heading', { name: /manage multiple client branded links without bitly markups/i }),
    ).toBeVisible();
    await expect(page.getByText(/5 branded client domains/i).first()).toBeVisible();
  });

  test('should load Bulk Dynamic QR landing page with enterprise highlights', async ({ page }) => {
    await page.goto('/solutions/bulk-dynamic-qr');
    await expect(
      page.getByRole('heading', { name: /dynamic qr codes that eliminate physical reprinting costs/i }),
    ).toBeVisible();
    await expect(page.getByText(/update anytime without reprinting/i).first()).toBeVisible();
  });

  test('should load UPI QR Tool and generate live SVG preview', async ({ page }) => {
    await page.goto('/tools/upi-qr-generator');
    await expect(
      page.getByRole('heading', { name: /create branded upi payment qr codes with your business logo/i }),
    ).toBeVisible();

    // Switch to UPI Pay tab
    await page.getByRole('tab', { name: /upi pay/i }).click();

    // Fill UPI VPA and amount
    await page.getByLabel(/upi id/i).fill('agency@upi');
    await page.getByLabel(/payee name/i).fill('Agency Studio');

    // Verify canvas preview renders
    await expect(page.locator('canvas')).toBeVisible();
  });
});
