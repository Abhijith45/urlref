import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/db';
import { SessionService, SESSION_COOKIE_NAME } from '../src/modules/auth/session.service';

describe('Links Management & Multi-Tenant Isolation (Integration)', () => {
  const app = createApp();

  const userA = { id: 'a0000000-0000-4000-8000-000000000001', role: 'USER' };
  const userB = { id: 'b0000000-0000-4000-8000-000000000002', role: 'USER' };

  const tokenUserA = SessionService.createSessionToken(userA.id, userA.role);
  const tokenUserB = SessionService.createSessionToken(userB.id, userB.role);

  it('POST /api/v1/links should create a short link scoped to authenticated user', async () => {
    vi.spyOn(prisma.link, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.link, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.link, 'create').mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174001',
      userId: userA.id,
      code: 'xyz1234',
      destinationUrl: 'https://developer.mozilla.org',
      title: 'MDN Web',
      isActive: true,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/v1/links')
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${tokenUserA}`])
      .send({
        destinationUrl: 'https://developer.mozilla.org',
        title: 'MDN Web',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('code', 'xyz1234');
    expect(res.body.data).toHaveProperty('userId', userA.id);
  });

  it('POST /api/v1/links should reject requests without session cookie with 401', async () => {
    const res = await request(app)
      .post('/api/v1/links')
      .send({ destinationUrl: 'https://developer.mozilla.org' });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHENTICATED');
  });

  const validLinkId = '123e4567-e89b-12d3-a456-426614174000';

  it('GET /api/v1/links/:id should enforce tenant isolation (User B cannot read User A link)', async () => {
    // When queried with WHERE id = validLinkId AND userId = 'usr_bbb', DB returns null
    vi.spyOn(prisma.link, 'findFirst').mockResolvedValueOnce(null);

    const res = await request(app)
      .get(`/api/v1/links/${validLinkId}`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${tokenUserB}`]);

    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'LINK_NOT_FOUND');
  });

  it('DELETE /api/v1/links/:id should enforce tenant isolation (User B cannot delete User A link)', async () => {
    vi.spyOn(prisma.link, 'findFirst').mockResolvedValueOnce(null);

    const res = await request(app)
      .delete(`/api/v1/links/${validLinkId}`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${tokenUserB}`]);

    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'LINK_NOT_FOUND');
  });
});
