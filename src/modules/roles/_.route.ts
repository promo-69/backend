import { Router } from 'express';
import rolesController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();
const readMiddleware = [verifySession, verifyPermission('CRUD:READ:ROLES')];
const createMiddleware = [verifySession, verifyPermission('CRUD:CREATE:ROLES')];
const updateMiddleware = [verifySession, verifyPermission('CRUD:UPDATE:ROLES')];
const deleteMiddleware = [verifySession, verifyPermission('CRUD:DELETE:ROLES')];

router.get('/', ...readMiddleware, rolesController.findAll);
router.get('/:id', ...readMiddleware, rolesController.findById);
router.post('/', ...createMiddleware, rolesController.create);
router.patch('/:id', ...updateMiddleware, rolesController.update);
router.delete('/:id', ...deleteMiddleware, rolesController.remove);
router.post('/:id/permissions', ...updateMiddleware, rolesController.assignPermissions);
router.delete('/:id/permissions', ...updateMiddleware, rolesController.removePermissions);

export default router;
