import { Request, Response, NextFunction } from 'express';
import { WorkspacesService } from './workspaces.service';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '@shortener/shared';

export class WorkspacesController {
  static async listUserWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const email = (req as any).user?.email;

      // Always guarantee user has at least their personal workspace
      await WorkspacesService.getOrCreatePersonalWorkspace(userId, email);

      const workspaces = await WorkspacesService.getUserWorkspaces(userId);
      res.status(200).json({ data: workspaces });
    } catch (err) {
      next(err);
    }
  }

  static async createWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const parsed = createWorkspaceSchema.parse(req.body);
      const workspace = await WorkspacesService.createWorkspace(userId, parsed);
      res.status(201).json({ data: workspace });
    } catch (err) {
      next(err);
    }
  }

  static async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const workspaceId = req.params.workspaceId as string;
      const members = await WorkspacesService.getWorkspaceMembers(workspaceId, userId);
      res.status(200).json({ data: members });
    } catch (err) {
      next(err);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const workspaceId = req.params.workspaceId as string;
      const parsed = inviteMemberSchema.parse(req.body);
      const invite = await WorkspacesService.inviteMember(workspaceId, userId, parsed);
      res.status(201).json({ data: invite });
    } catch (err) {
      next(err);
    }
  }

  static async acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const token = req.params.token as string;
      const workspace = await WorkspacesService.acceptInvite(token, userId);
      res.status(200).json({ data: workspace });
    } catch (err) {
      next(err);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const workspaceId = req.params.workspaceId as string;
      const memberId = req.params.memberId as string;
      const parsed = updateMemberRoleSchema.parse(req.body);
      const updated = await WorkspacesService.updateMemberRole(workspaceId, userId, memberId, parsed);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const workspaceId = req.params.workspaceId as string;
      const memberId = req.params.memberId as string;
      await WorkspacesService.removeMember(workspaceId, userId, memberId);
      res.status(200).json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  }
}
