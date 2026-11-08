import { BrowserContext, APIRequestContext } from '@playwright/test';

export interface TestUserCredentials {
  email: string;
  password: string;
  userId: string;
  sidCookie: string;
}

/**
 * Creates an isolated test user via API and returns credentials with session cookie.
 */
export async function createIsolatedTestUser(
  request: APIRequestContext,
  apiBaseUrl = 'http://localhost:5000',
): Promise<TestUserCredentials> {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `smoke_${timestamp}_${randomSuffix}@softics.in`;
  const password = 'SmokePassword123!';

  const response = await request.post(`${apiBaseUrl}/api/v1/auth/register`, {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(`Failed to create test user: ${response.status()} ${errorBody}`);
  }

  const resJson = await response.json();
  const userId = resJson.data.id;

  // Extract 'sid' cookie from Set-Cookie header
  const headers = response.headersArray();
  const setCookieHeader = headers.find((h) => h.name.toLowerCase() === 'set-cookie')?.value || '';
  const sidMatch = setCookieHeader.match(/sid=([^;]+)/);
  const sidCookie = sidMatch ? sidMatch[1] : '';

  return {
    email,
    password,
    userId,
    sidCookie,
  };
}

/**
 * Injects session cookie into browser context for seamless authenticated tests.
 */
export async function authenticateBrowserContext(
  context: BrowserContext,
  sidCookie: string,
): Promise<void> {
  await context.addCookies([
    {
      name: 'sid',
      value: sidCookie,
      url: 'http://localhost:5000',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'sid',
      value: sidCookie,
      url: 'http://localhost:5173',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Generates sample CSV string for bulk import testing.
 */
export function generateTestCsvContent(
  rows: Array<{
    destinationUrl: string;
    title?: string;
    customAlias?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }>,
): string {
  const headers = [
    'destinationUrl',
    'title',
    'customAlias',
    'utm_source',
    'utm_medium',
    'utm_campaign',
  ];

  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push(
      [
        row.destinationUrl,
        row.title || '',
        row.customAlias || '',
        row.utmSource || '',
        row.utmMedium || '',
        row.utmCampaign || '',
      ].join(','),
    );
  }

  return lines.join('\r\n');
}
