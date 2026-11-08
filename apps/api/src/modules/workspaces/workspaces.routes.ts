import { Router } from 'express';
import { WorkspacesController } from './workspaces.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// All workspace endpoints require an authenticated user
router.use(requireAuth);

router.get('/', WorkspacesController.listUserWorkspaces);
router.post('/', WorkspacesController.createWorkspace);
router.post('/invites/:token/accept', WorkspacesController.acceptInvite);

router.get('/:workspaceId/members', WorkspacesController.listMembers);
router.post('/:workspaceId/invites', WorkspacesController.inviteMember);
router.patch('/:workspaceId/members/:memberId', WorkspacesController.updateMemberRole);
router.delete('/:workspaceId/members/:memberId', WorkspacesController.removeMember);

export default router;
