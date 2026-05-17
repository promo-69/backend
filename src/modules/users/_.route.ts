import { Router } from 'express';
import usersController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();
const managerMiddleware = [verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS'])];

// --- Perfil del Usuario Logueado)
router.get('/me', verifySession, usersController.getMyProfile);
router.patch('/me/profile', verifySession, usersController.updateMyProfile);
router.patch('/me/security', verifySession, usersController.updateMySecurity);

// --- Exclusivo para Gerencia
router.get('/', ...managerMiddleware, usersController.getAllUsers);
router.patch('/:id/status', ...managerMiddleware, usersController.changeUserStatus);

export default router;
