import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/db';
import argon2 from 'argon2';

describe('Auth API Flow (Integration)', () => {
  const app = createApp();

  it('POST /api/v1/auth/register should validate invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'Password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/register should create a new user and set HTTP-only cookie', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
    vi.spyOn(prisma.user, 'create').mockResolvedValueOnce({
      id: 'usr_new_123',
      email: 'newuser@example.com',
      passwordHash: 'hash',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'newuser@example.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('email', 'newuser@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/v1/auth/login should authenticate user with valid credentials', async () => {
    const hash = await argon2.hash('ValidPass123!');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 'usr_login_123',
      email: 'login@example.com',
      passwordHash: hash,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'ValidPass123!' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('email', 'login@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/v1/auth/login should reject incorrect password', async () => {
    const hash = await argon2.hash('ValidPass123!');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 'usr_login_123',
      email: 'login@example.com',
      passwordHash: hash,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPassword999!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHENTICATED');
  });

  it('POST /api/v1/auth/logout should clear session cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    // Cookie expires in the past
    expect(res.headers['set-cookie'][0]).toContain('sid=;');
  });
});
