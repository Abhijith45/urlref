import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/db';
import { SessionService, SESSION_COOKIE_NAME } from '../src/modules/auth/session.service';

const app = createApp();

describe('Custom Branded Domains API (Integration)', () => {
  const freeUserId = 'd0000000-0000-4000-8000-000000000001';
  const proUserId = 'd0000000-0000-4000-8000-000000000002';
  let freeAuthCookie: string;
  let proAuthCookie: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.customDomain.deleteMany();
    await prisma.user.deleteMany({
      where: {
        id: { in: [freeUserId, proUserId] },
      },
    });

    // Seed Free User (0 custom domains allowed)
    await prisma.user.create({
      data: {
        id: freeUserId,
        email: 'free-user@example.com',
        role: 'USER',
        plan: 'FREE',
      },
    });

    // Seed Pro User (1 custom domain allowed)
    await prisma.user.create({
      data: {
        id: proUserId,
        email: 'pro-user@example.com',
        role: 'USER',
        plan: 'PRO',
      },
    });

    const freeToken = SessionService.createSessionToken(freeUserId, 'USER');
    freeAuthCookie = `${SESSION_COOKIE_NAME}=${freeToken}`;

    const proToken = SessionService.createSessionToken(proUserId, 'USER');
    proAuthCookie = `${SESSION_COOKIE_NAME}=${proToken}`;
  });

  it('GET /api/v1/domains should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/domains');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/domains should reject Free tier users with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/domains')
      .set('Cookie', freeAuthCookie)
      .send({ hostname: 'links.freebrand.com' });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('exclusive feature of Pro');
  });

  it('POST /api/v1/domains should validate invalid hostname formats with 400', async () => {
    const res = await request(app)
      .post('/api/v1/domains')
      .set('Cookie', proAuthCookie)
      .send({ hostname: 'https://invalid-with-protocol.com' });

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/domains should register a domain for Pro tier and return verification token', async () => {
    const res = await request(app)
      .post('/api/v1/domains')
      .set('Cookie', proAuthCookie)
      .send({
        hostname: 'go.myprobrand.com',
        custom404Url: 'https://myprobrand.com/404',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.hostname).toBe('go.myprobrand.com');
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.verificationToken).toBeDefined();
    expect(res.body.data.cnameTarget).toBe('cname.urlref.softics.in');
  });

  it('POST /api/v1/domains should enforce Pro tier limit (max 1 domain)', async () => {
    // First domain succeeds
    await request(app)
      .post('/api/v1/domains')
      .set('Cookie', proAuthCookie)
      .send({ hostname: 'first.myprobrand.com' });

    // Second domain fails with 403
    const res = await request(app)
      .post('/api/v1/domains')
      .set('Cookie', proAuthCookie)
      .send({ hostname: 'second.myprobrand.com' });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('maximum allowed custom domains');
  });

  it('DELETE /api/v1/domains/:id should delete custom domain with ownership check', async () => {
    const created = await prisma.customDomain.create({
      data: {
        userId: proUserId,
        hostname: 'delete-me.brand.com',
        status: 'PENDING',
        verificationToken: 'test_token',
      },
    });

    const res = await request(app)
      .delete(`/api/v1/domains/${created.id}`)
      .set('Cookie', proAuthCookie);

    expect(res.status).toBe(200);

    const check = await prisma.customDomain.findUnique({ where: { id: created.id } });
    expect(check).toBeNull();
  });
});
