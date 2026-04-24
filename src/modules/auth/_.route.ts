import { Router } from 'express';
import authController from './_.controller.js';
import { verifySession, preventAuthenticatedAccess } from '@middlewares/auth.middleware.js';

const router = Router();

// --- Auth & Session ---
router.post('/login', preventAuthenticatedAccess, authController.login);
router.post('/signup', preventAuthenticatedAccess, authController.signup);
router.post('/verify-signup', preventAuthenticatedAccess, authController.verifySignup);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', verifySession, authController.me);
router.patch('/profile', verifySession, authController.updateProfile);

// --- Password Reset ---
router.post('/forgot-password', preventAuthenticatedAccess, authController.forgotPassword);
router.post('/verify-reset-code', preventAuthenticatedAccess, authController.verifyResetCode);
router.post('/reset-password', preventAuthenticatedAccess, authController.resetPassword);

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
