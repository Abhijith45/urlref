import crypto from 'crypto';
import { prisma } from '../../database/db';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../errors/app-error';
import {
  CreateWorkspaceInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
  UpdateWorkspaceInput,
  WorkspaceDto,
  WorkspaceInviteDto,
  WorkspaceMemberDto,
  WorkspaceRole,
} from '@shortener/shared';

export class WorkspacesService {
  /**
   * Automatically gets or provisions the user's default personal workspace.
   */
  static async getOrCreatePersonalWorkspace(userId: string, email?: string): Promise<WorkspaceDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, plan: true },
    });

    const userEmail = email || user?.email || 'user@example.com';
    const personalSlug = `personal-${userId.slice(0, 8)}`;

    const existing = await prisma.workspace.findFirst({
      where: { ownerId: userId, slug: personalSlug },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        ownerId: existing.ownerId,
        plan: existing.plan,
        role: 'OWNER',
        membersCount: existing._count.members,
        createdAt: existing.createdAt.toISOString(),
        updatedAt: existing.updatedAt.toISOString(),
      };
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: `${userEmail.split('@')[0]}'s Workspace`,
        slug: personalSlug,
        ownerId: userId,
        plan: user?.plan || 'FREE',
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
      plan: workspace.plan,
      role: 'OWNER',
      membersCount: workspace._count.members,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }

  /**
   * Updates workspace settings (name).
   */
  static async updateWorkspace(
    workspaceId: string,
    actorUserId: string,
    input: UpdateWorkspaceInput,
  ): Promise<WorkspaceDto> {
    const actorRole = await this.verifyMembership(workspaceId, actorUserId);
    if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
      throw new ForbiddenError('Only workspace Owners and Admins can update workspace details.');
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(input.name ? { name: input.name } : {}),
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      ownerId: updated.ownerId,
      plan: updated.plan,
      role: actorRole,
      membersCount: updated._count.members,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves all workspaces the user has access to (as owner or member).
   */
  static async getUserWorkspaces(userId: string): Promise<WorkspaceDto[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      ownerId: m.workspace.ownerId,
      plan: m.workspace.plan,
      role: m.role as WorkspaceRole,
      membersCount: m.workspace._count.members,
      createdAt: m.workspace.createdAt.toISOString(),
      updatedAt: m.workspace.updatedAt.toISOString(),
    }));
  }

  /**
   * Creates a new agency team workspace.
   */
  static async createWorkspace(
    userId: string,
    input: CreateWorkspaceInput,
  ): Promise<WorkspaceDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    // Check if user is on AGENCY tier for creating multi-member team workspaces
    const existingWorkspaces = await prisma.workspace.count({
      where: { ownerId: userId },
    });

    if (existingWorkspaces >= 1 && user?.plan !== 'AGENCY') {
      throw new ForbiddenError(
        'Multi-seat agency team workspaces require the Agency tier plan. Please upgrade to unlock team collaboration.',
      );
    }

    const existingSlug = await prisma.workspace.findUnique({
      where: { slug: input.slug },
    });

    if (existingSlug) {
      throw new ConflictError('A workspace with this URL slug already exists. Please choose another.');
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug: input.slug,
        ownerId: userId,
        plan: user?.plan || 'FREE',
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
      plan: workspace.plan,
      role: 'OWNER',
      membersCount: workspace._count.members,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves members of a given workspace with permission verification.
   */
  static async getWorkspaceMembers(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMemberDto[]> {
    await this.verifyMembership(workspaceId, userId);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      workspaceId: m.workspaceId,
      userId: m.userId,
      role: m.role as WorkspaceRole,
      joinedAt: m.joinedAt.toISOString(),
      user: {
        id: m.user.id,
        email: m.user.email,
      },
    }));
  }

  /**
   * Creates an invite for a new team member.
   */
  static async inviteMember(
    workspaceId: string,
    actorUserId: string,
    input: InviteMemberInput,
  ): Promise<WorkspaceInviteDto> {
    const actorRole = await this.verifyMembership(workspaceId, actorUserId);
    if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
      throw new ForbiddenError('Only workspace Owners and Admins can invite new members.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId,
        email: input.email,
      },
    });

    let invite;
    if (existingInvite) {
      invite = await prisma.workspaceInvite.update({
        where: { id: existingInvite.id },
        data: {
          role: input.role,
          token,
          expiresAt,
        },
      });
    } else {
      invite = await prisma.workspaceInvite.create({
        data: {
          workspaceId,
          email: input.email,
          role: input.role,
          token,
          expiresAt,
        },
      });
    }

    return {
      id: invite.id,
      workspaceId: invite.workspaceId,
      email: invite.email,
      role: invite.role as WorkspaceRole,
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
    };
  }

  /**
   * Accepts an invitation using token.
   */
  static async acceptInvite(token: string, userId: string): Promise<WorkspaceDto> {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite || invite.expiresAt < new Date()) {
      throw new BadRequestError('Invitation link is invalid or has expired.');
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId,
        },
      },
    });

    if (!existingMember) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
        },
      });
    }

    // Clean up consumed invite
    await prisma.workspaceInvite.delete({
      where: { id: invite.id },
    });

    return {
      id: invite.workspace.id,
      name: invite.workspace.name,
      slug: invite.workspace.slug,
      ownerId: invite.workspace.ownerId,
      plan: invite.workspace.plan,
      role: invite.role as WorkspaceRole,
      createdAt: invite.workspace.createdAt.toISOString(),
      updatedAt: invite.workspace.updatedAt.toISOString(),
    };
  }

  /**
   * Updates a member's role (OWNER only).
   */
  static async updateMemberRole(
    workspaceId: string,
    actorUserId: string,
    targetMemberId: string,
    input: UpdateMemberRoleInput,
  ): Promise<WorkspaceMemberDto> {
    const actorRole = await this.verifyMembership(workspaceId, actorUserId);
    if (actorRole !== 'OWNER') {
      throw new ForbiddenError('Only the Workspace Owner can alter member roles.');
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: targetMemberId },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundError('Member not found in this workspace.');
    }

    if (targetMember.role === 'OWNER') {
      throw new BadRequestError('Cannot change the role of the workspace Owner.');
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: targetMemberId },
      data: { role: input.role },
      include: { user: { select: { id: true, email: true } } },
    });

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      userId: updated.userId,
      role: updated.role as WorkspaceRole,
      joinedAt: updated.joinedAt.toISOString(),
      user: {
        id: updated.user.id,
        email: updated.user.email,
      },
    };
  }

  /**
   * Removes a member from a workspace.
   */
  static async removeMember(
    workspaceId: string,
    actorUserId: string,
    targetMemberId: string,
  ): Promise<void> {
    const actorRole = await this.verifyMembership(workspaceId, actorUserId);
    if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
      throw new ForbiddenError('Only workspace Owners and Admins can remove members.');
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: targetMemberId },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundError('Member not found in this workspace.');
    }

    if (targetMember.role === 'OWNER') {
      throw new BadRequestError('Cannot remove the workspace Owner.');
    }

    await prisma.workspaceMember.delete({
      where: { id: targetMemberId },
    });
  }

  /**
   * Verifies if a user is a member of the workspace and returns their role.
   */
  static async verifyMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceRole> {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenError('You do not have access to this workspace.');
    }

    return member.role as WorkspaceRole;
  }
}
