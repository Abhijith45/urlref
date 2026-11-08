import { BulkLinkRowInput, BulkImportRowResult } from '@shortener/shared';

/**
 * Parses an RFC 4180 CSV string into records with handling for quotes and commas.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Last cell
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header keys to standard schema field names.
 */
function normalizeHeaderKey(rawHeader: string): string {
  const cleaned = rawHeader.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (['destinationurl', 'url', 'destination_url', 'destination', 'targeturl', 'link'].includes(cleaned)) {
    return 'destinationUrl';
  }
  if (['title', 'name', 'notename', 'label'].includes(cleaned)) {
    return 'title';
  }
  if (['customalias', 'alias', 'code', 'slug', 'shortcode'].includes(cleaned)) {
    return 'customAlias';
  }
  if (['utm_source', 'utmsource', 'source'].includes(cleaned)) {
    return 'utmSource';
  }
  if (['utm_medium', 'utmmedium', 'medium'].includes(cleaned)) {
    return 'utmMedium';
  }
  if (['utm_campaign', 'utmcampaign', 'campaign'].includes(cleaned)) {
    return 'utmCampaign';
  }
  if (['utm_term', 'utmterm', 'term'].includes(cleaned)) {
    return 'utmTerm';
  }
  if (['utm_content', 'utmcontent', 'content'].includes(cleaned)) {
    return 'utmContent';
  }
  return cleaned;
}

/**
 * Converts parsed raw CSV rows into validated BulkLinkRowInput array.
 */
export function parseBulkCsvContent(csvContent: string): { rows: BulkLinkRowInput[]; errors: string[] } {
  const rawRows = parseCsvRows(csvContent);
  const errors: string[] = [];

  if (rawRows.length < 2) {
    errors.push('CSV must contain a header row and at least one data row.');
    return { rows: [], errors };
  }

  const rawHeaders = rawRows[0];
  const headers = rawHeaders.map(normalizeHeaderKey);
  const destIndex = headers.indexOf('destinationUrl');

  if (destIndex === -1) {
    errors.push('Required header "destinationUrl" (or "url") not found in CSV.');
    return { rows: [], errors };
  }

  const parsedRows: BulkLinkRowInput[] = [];

  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const rowObj: Record<string, string> = {};

    headers.forEach((header, colIndex) => {
      if (header && colIndex < row.length) {
        rowObj[header] = row[colIndex];
      }
    });

    const destinationUrl = rowObj.destinationUrl?.trim();
    if (!destinationUrl) {
      continue; // skip empty rows
    }

    parsedRows.push({
      destinationUrl,
      title: rowObj.title?.trim() || undefined,
      customAlias: rowObj.customAlias?.trim() || undefined,
      utmSource: rowObj.utmSource?.trim() || undefined,
      utmMedium: rowObj.utmMedium?.trim() || undefined,
      utmCampaign: rowObj.utmCampaign?.trim() || undefined,
      utmTerm: rowObj.utmTerm?.trim() || undefined,
      utmContent: rowObj.utmContent?.trim() || undefined,
    });
  }

  if (parsedRows.length === 0) {
    errors.push('No valid link rows found with destination URLs.');
  }

  return { rows: parsedRows, errors };
}

/**
 * Generates sample CSV template content for download.
 */
export function generateSampleCsvTemplate(): string {
  const headers = ['destinationUrl', 'title', 'customAlias', 'utm_source', 'utm_medium', 'utm_campaign'];
  const examples = [
    ['https://example.com/summer-sale', 'Summer Promo 2026', 'summer26', 'google', 'cpc', 'summer_campaign'],
    ['https://example.com/newsletter-signup', 'Weekly Newsletter', '', 'newsletter', 'email', 'weekly_digest'],
    ['https://example.com/packaging-user-guide', 'QR on Box packaging', 'box-guide', 'packaging', 'print', 'q2_packaging'],
  ];

  const lines = [headers.join(',')];
  for (const ex of examples) {
    lines.push(ex.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(','));
  }
  return lines.join('\r\n');
}

/**
 * Sanitizes cell for CSV export to neutralize CWE-1236 injection.
 */
function sanitizeCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates downloadable results CSV from batch import output.
 */
export function generateBulkResultsCsv(results: BulkImportRowResult[]): string {
  const headers = ['Row Number', 'Destination URL', 'Short URL', 'Code', 'Status', 'Error Message'];
  const rows = [headers.join(',')];

  for (const res of results) {
    rows.push(
      [
        sanitizeCell(res.rowNumber),
        sanitizeCell(res.destinationUrl),
        sanitizeCell(res.shortUrl || ''),
        sanitizeCell(res.code || ''),
        sanitizeCell(res.status === 'success' ? 'SUCCESS' : 'FAILED'),
        sanitizeCell(res.error || ''),
      ].join(',')
    );
  }

  return rows.join('\r\n');
}

/**
 * Triggers a browser file download for text/csv data.
 */
export function downloadCsvBlob(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
