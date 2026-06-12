import { Router } from 'express';
import PermissionsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();
const readMiddleware = [verifySession, verifyPermission('CRUD:READ:PERMISSIONS')];
const createMiddleware = [verifySession, verifyPermission('CRUD:CREATE:PERMISSIONS')];
const updateMiddleware = [verifySession, verifyPermission('CRUD:UPDATE:PERMISSIONS')];
const deleteMiddleware = [verifySession, verifyPermission('CRUD:DELETE:PERMISSIONS')];

router.get('/', ...readMiddleware, PermissionsController.findAll);
router.get('/:id', ...readMiddleware, PermissionsController.findById);
router.post('/', ...createMiddleware, PermissionsController.create);
router.patch('/:id', ...updateMiddleware, PermissionsController.update);
router.delete('/:id', ...deleteMiddleware, PermissionsController.remove);

export default router;
