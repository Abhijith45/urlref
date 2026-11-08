import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/db';
import { SessionService, SESSION_COOKIE_NAME } from '../src/modules/auth/session.service';

const app = createApp();

describe('Multi-Seat Workspaces & RBAC API (Integration)', () => {
  const freeUserId = 'e0000000-0000-4000-8000-000000000001';
  const agencyUserId = 'e0000000-0000-4000-8000-000000000002';
  const inviteeUserId = 'e0000000-0000-4000-8000-000000000003';

  let freeAuthCookie: string;
  let agencyAuthCookie: string;
  let inviteeAuthCookie: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.workspaceInvite.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany({
      where: {
        id: { in: [freeUserId, agencyUserId, inviteeUserId] },
      },
    });

    // Seed Free User
    await prisma.user.create({
      data: {
        id: freeUserId,
        email: 'free-owner@example.com',
        role: 'USER',
        plan: 'FREE',
      },
    });

    // Seed Agency User (Allowed to create agency team workspaces)
    await prisma.user.create({
      data: {
        id: agencyUserId,
        email: 'agency-owner@example.com',
        role: 'USER',
        plan: 'AGENCY',
      },
    });

    // Seed Invitee User
    await prisma.user.create({
      data: {
        id: inviteeUserId,
        email: 'team-member@example.com',
        role: 'USER',
        plan: 'FREE',
      },
    });

    freeAuthCookie = `${SESSION_COOKIE_NAME}=${SessionService.createSessionToken(freeUserId, 'USER')}`;
    agencyAuthCookie = `${SESSION_COOKIE_NAME}=${SessionService.createSessionToken(agencyUserId, 'USER')}`;
    inviteeAuthCookie = `${SESSION_COOKIE_NAME}=${SessionService.createSessionToken(inviteeUserId, 'USER')}`;
  });

  it('GET /api/v1/workspaces should auto-create and return default personal workspace', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Cookie', freeAuthCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].role).toBe('OWNER');
    expect(res.body.data[0].name).toContain('free-owner');
  });

  it('POST /api/v1/workspaces should reject Free user creating secondary team workspace with 403', async () => {
    // Ensure personal workspace exists first
    await request(app).get('/api/v1/workspaces').set('Cookie', freeAuthCookie);

    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Cookie', freeAuthCookie)
      .send({
        name: 'Forbidden Agency Team',
        slug: 'forbidden-team',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/Agency tier plan/i);
  });

  it('POST /api/v1/workspaces should allow Agency tier user to create team workspace', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Cookie', agencyAuthCookie)
      .send({
        name: 'Apex Marketing Agency',
        slug: 'apex-marketing',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Apex Marketing Agency');
    expect(res.body.data.slug).toBe('apex-marketing');
    expect(res.body.data.role).toBe('OWNER');
  });

  it('should support inviting, accepting, updating role, and removing a team member', async () => {
    // 1. Agency user creates team workspace
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Cookie', agencyAuthCookie)
      .send({
        name: 'Creative Studio',
        slug: 'creative-studio',
      });
    const workspaceId = wsRes.body.data.id;

    // 2. Owner invites a member
    const inviteRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/invites`)
      .set('Cookie', agencyAuthCookie)
      .send({
        email: 'team-member@example.com',
        role: 'MEMBER',
      });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.token).toBeDefined();
    const token = inviteRes.body.data.token;

    // 3. Invitee accepts the invite
    const acceptRes = await request(app)
      .post(`/api/v1/workspaces/invites/${token}/accept`)
      .set('Cookie', inviteeAuthCookie);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.id).toBe(workspaceId);

    // 4. List members as Owner
    const listRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Cookie', agencyAuthCookie);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(2);

    const memberRecord = listRes.body.data.find(
      (m: any) => m.userId === inviteeUserId,
    );
    expect(memberRecord).toBeDefined();
    expect(memberRecord.role).toBe('MEMBER');

    // 5. Update member role to ADMIN
    const updateRoleRes = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/members/${memberRecord.id}`)
      .set('Cookie', agencyAuthCookie)
      .send({ role: 'ADMIN' });

    expect(updateRoleRes.status).toBe(200);
    expect(updateRoleRes.body.data.role).toBe('ADMIN');

    // 6. Remove member
    const deleteRes = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/members/${memberRecord.id}`)
      .set('Cookie', agencyAuthCookie);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.success).toBe(true);
  });
});
