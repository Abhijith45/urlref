import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/db';

const app = createApp();

describe('Caddy On-Demand TLS Handshake Security (Integration)', () => {
  const testUserId = 'c0000000-0000-4000-8000-000000000001';

  beforeEach(async () => {
    await prisma.customDomain.deleteMany();
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });

    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'caddy-test@example.com',
        role: 'USER',
        plan: 'PRO',
      },
    });

    // Seed an ACTIVE custom domain
    await prisma.customDomain.create({
      data: {
        userId: testUserId,
        hostname: 'links.acmecorp.com',
        status: 'ACTIVE',
        verificationToken: 'token_active_12345',
      },
    });

    // Seed a PENDING custom domain
    await prisma.customDomain.create({
      data: {
        userId: testUserId,
        hostname: 'unverified.partner.io',
        status: 'PENDING',
        verificationToken: 'token_pending_12345',
      },
    });
  });

  it('GET /api/v1/domains/caddy-ask should reject request without domain with 400', async () => {
    const res = await request(app).get('/api/v1/domains/caddy-ask');
    expect(res.status).toBe(400);
    expect(res.text).toMatch(/Missing domain parameter/i);
  });

  it('GET /api/v1/domains/caddy-ask should authorize native platform domains with 200', async () => {
    const res1 = await request(app).get('/api/v1/domains/caddy-ask?domain=urlref.softics.in');
    expect(res1.status).toBe(200);

    const res2 = await request(app).get('/api/v1/domains/caddy-ask?domain=apiref.softics.in');
    expect(res2.status).toBe(200);

    const res3 = await request(app).get('/api/v1/domains/caddy-ask?domain=localhost');
    expect(res3.status).toBe(200);
  });

  it('GET /api/v1/domains/caddy-ask should authorize ACTIVE customer domain with 200', async () => {
    const res = await request(app).get('/api/v1/domains/caddy-ask?domain=links.acmecorp.com');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Domain authorized/i);
  });

  it('GET /api/v1/domains/caddy-ask should reject PENDING/unverified domain with 404', async () => {
    const res = await request(app).get('/api/v1/domains/caddy-ask?domain=unverified.partner.io');
    expect(res.status).toBe(404);
    expect(res.text).toMatch(/not authorized/i);
  });

  it('GET /api/v1/domains/caddy-ask should reject random nonexistent domain with 404', async () => {
    const res = await request(app).get('/api/v1/domains/caddy-ask?domain=malicious-hijack.com');
    expect(res.status).toBe(404);
    expect(res.text).toMatch(/not authorized/i);
  });
});
