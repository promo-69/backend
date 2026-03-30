import { Router } from 'express';
import authController from './_.controller.js';
import { verifySession, preventDoubleLogin } from '@middlewares/auth.middleware.js';

const router = Router();

// --- Authentication ---
router.post('/login', preventDoubleLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/register', preventDoubleLogin, authController.register);

// --- Roles ---
router.get('/roles', verifySession, authController.findAllRoles);
router.get('/roles/:id', verifySession, authController.findRoleById);

// --- Permissions ---
router.get('/permissions', verifySession, authController.findAllPermissions);
router.get('/permissions/:id', verifySession, authController.findPermissionById);

// --- Users ---
router.get('/users', verifySession, authController.findAllUsers);
router.get('/users/:id', verifySession, authController.findUserById);
router.post('/users', verifySession, authController.createUser);

export default router;
