import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Health & Readiness Endpoints (Integration)', () => {
  const app = createApp();

  it('GET /health should return 200 with service liveness status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET /health?warmup=true should return 200 and warm up connection', async () => {
    const res = await request(app).get('/health?warmup=true');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('GET /api/v1/health should return 200 with service liveness status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('GET /ready should respond with HTTP readiness check', async () => {
    const res = await request(app).get('/ready');
    // Depending on local DB connectivity status
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });
});
