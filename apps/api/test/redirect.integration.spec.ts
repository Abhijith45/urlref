import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/db';

describe('Public 302 Redirect Engine (Integration)', () => {
  const app = createApp();

  it('GET /:code should return 404 for invalid code characters', async () => {
    const res = await request(app).get('/invalid@code!');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'LINK_NOT_FOUND');
  });

  it('GET /:code should return 404 when link is not found in database', async () => {
    vi.spyOn(prisma.link, 'findUnique').mockResolvedValueOnce(null);

    const res = await request(app).get('/notfound123');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'LINK_NOT_FOUND');
  });

  it('GET /:code should return 302 with Location and no-cache headers for active link', async () => {
    vi.spyOn(prisma.link, 'findUnique').mockResolvedValueOnce({
      id: 'link_123',
      code: 'promo26',
      destinationUrl: 'https://github.com/nodejs/node',
      isActive: true,
      expiresAt: null,
    } as any);

    const res = await request(app).get('/promo26');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://github.com/nodejs/node');
    expect(res.headers['cache-control']).toContain('no-cache');
  });

  it('GET /:code should return 410 Gone for disabled/inactive link', async () => {
    vi.spyOn(prisma.link, 'findUnique').mockResolvedValueOnce({
      id: 'link_123',
      code: 'disabled_link',
      destinationUrl: 'https://example.com',
      isActive: false,
      expiresAt: null,
    } as any);

    const res = await request(app).get('/disabled_link');
    expect(res.status).toBe(410);
    expect(res.body.error).toHaveProperty('code', 'LINK_INACTIVE');
  });

  it('GET /:code should return 410 Gone for expired link', async () => {
    vi.spyOn(prisma.link, 'findUnique').mockResolvedValueOnce({
      id: 'link_123',
      code: 'expired_link',
      destinationUrl: 'https://example.com',
      isActive: true,
      expiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
    } as any);

    const res = await request(app).get('/expired_link');
    expect(res.status).toBe(410);
    expect(res.body.error).toHaveProperty('code', 'LINK_EXPIRED');
  });
});
