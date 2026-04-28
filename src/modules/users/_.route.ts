import { Router } from 'express';
import usersController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();
const adminMiddleware = [verifySession, verifyRole(['ADMINISTRATOR'])];

router.post('/', ...adminMiddleware, usersController.createAccount);
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
router.post('/users', verifySession, usersController.createUser);
router.patch('/profile', verifySession, usersController.updateProfile);

export default router;
