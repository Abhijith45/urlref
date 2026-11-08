import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/db';
import { Express } from 'express';
import { AuthService } from '../src/modules/auth/auth.service';
import { SessionService, SESSION_COOKIE_NAME } from '../src/modules/auth/session.service';

describe('Billing & Subscription API (Integration)', () => {
  let app: Express;
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = createApp();

    // Create a dedicated test user for billing tests
    const timestamp = Date.now();
    const email = `billing-test-${timestamp}@example.com`;
    const password = 'Password123!Secure';

    const user = await AuthService.register({ email, password });
    testUserId = user.id;

    testUserToken = SessionService.createSessionToken(user.id, user.role);
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
  });

  it('GET /api/v1/billing/subscription should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/billing/subscription');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/billing/subscription should return free tier limits and usage for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/billing/subscription')
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${testUserToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.tier).toBe('FREE');
    expect(res.body.data.limits).toEqual({
      maxLinksPerMonth: 10,
      maxCustomDomains: 0,
      dynamicQrAllowed: false,
      analyticsRetentionDays: 7,
    });
    expect(res.body.data.usage).toBeDefined();
    expect(typeof res.body.data.usage.linksCreatedThisMonth).toBe('number');
  });

  it('POST /api/v1/billing/checkout should validate tier and interval input', async () => {
    const res = await request(app)
      .post('/api/v1/billing/checkout')
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${testUserToken}`])
      .send({ tier: 'INVALID_TIER', interval: 'invalid_interval' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/billing/portal should reject if user has no stripe customer', async () => {
    const res = await request(app)
      .post('/api/v1/billing/portal')
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${testUserToken}`]);

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/billing/webhook should reject request missing stripe-signature header', async () => {
    const res = await request(app)
      .post('/api/v1/billing/webhook')
      .send(JSON.stringify({ type: 'test' }));

    expect(res.status).toBe(400);
    expect(res.text).toContain('Missing stripe-signature header');
  });
});
