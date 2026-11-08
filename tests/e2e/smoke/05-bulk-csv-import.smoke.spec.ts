import { test, expect } from '@playwright/test';
import {
  createIsolatedTestUser,
  authenticateBrowserContext,
  generateTestCsvContent,
} from '../fixtures/test-helpers';

test.describe('Smoke 05: Bulk CSV Import Engine & Results Reporting', () => {
  test('should import batch CSV links, display preview table, and export results CSV', async ({
    context,
    page,
    request,
  }) => {
    // 1. Authenticate user
    const user = await createIsolatedTestUser(request);
    await authenticateBrowserContext(context, user.sidCookie);

    // 2. Navigate to /dashboard/links
    await page.goto('/dashboard/links');

    // 3. Open Bulk Import Modal
    await page.getByRole('button', { name: /bulk import \(csv\)/i }).click();
    await expect(
      page.getByRole('heading', { name: /bulk url shortener & dynamic qr engine/i }),
    ).toBeVisible();

    // 4. Test "Download Sample CSV" button
    const [templateDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download sample csv/i }).click(),
    ]);
    expect(templateDownload.suggestedFilename()).toBe('urlref_bulk_template.csv');

    // 5. Generate and upload synthetic CSV
    const timestamp = Date.now();
    const csvContent = generateTestCsvContent([
      {
        destinationUrl: 'https://example.com/batch-link-1',
        title: 'Batch Item 1',
        customAlias: `batch1_${timestamp}`,
        utmSource: 'agency',
        utmMedium: 'cpc',
        utmCampaign: 'bulk_run',
      },
      {
        destinationUrl: 'https://example.com/batch-link-2',
        title: 'Batch Item 2',
        customAlias: `batch2_${timestamp}`,
        utmSource: 'newsletter',
        utmMedium: 'email',
        utmCampaign: 'bulk_run',
      },
    ]);

    // Attach CSV payload via file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'smoke_batch.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    });

    // 6. Verify pre-flight preview table renders rows
    await expect(page.getByText(/2 rows detected/i)).toBeVisible();
    await expect(page.getByText('https://example.com/batch-link-1')).toBeVisible();
    await expect(page.getByText('https://example.com/batch-link-2')).toBeVisible();

    // 7. Submit batch import
    await page.getByRole('button', { name: /import 2 links/i }).click();

    // 8. Verify post-import success summary
    await expect(page.getByText(/bulk import completed/i)).toBeVisible();
    await expect(page.getByText(/successfully created 2 short links/i)).toBeVisible();

    // 9. Verify results CSV download
    const [resultsDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download results csv/i }).click(),
    ]);
    expect(resultsDownload.suggestedFilename()).toBe('urlref_bulk_results.csv');

    // 10. Click Done and verify table contains imported links
    await page.getByRole('button', { name: /done/i }).click();
    await expect(page.getByText(/batch-link-1/i).first()).toBeVisible();
  });
});
