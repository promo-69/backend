import { Router } from 'express';
import usersController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();
const adminMiddleware = [verifySession, verifyRole(['SUPER_ADMIN'])];

router.post('/admin', ...adminMiddleware, usersController.createAdministrativeAccount);
router.post('/client', ...adminMiddleware, usersController.createClientAccount);
router.patch('/:id/status', ...adminMiddleware, usersController.changeStatus);

// --- Roles ---
router.get('/roles', ...adminMiddleware, usersController.findAllRoles);
router.get('/roles/:id', ...adminMiddleware, usersController.findRoleById);

// --- Permissions ---
router.get('/permissions', ...adminMiddleware, usersController.findAllPermissions);
router.get('/permissions/:id', ...adminMiddleware, usersController.findPermissionById);

// --- Users ---
router.get('/users', verifySession, usersController.findAllUsers);
router.get('/users/:id', verifySession, usersController.findUserById);
router.patch('/profile', verifySession, usersController.updateProfile);

export default router;
