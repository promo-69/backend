import { Router } from 'express';
import usersController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();
const managerMiddleware = [verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS'])];

// --- Perfil del Usuario Logueado)
router.get('/me', verifySession, usersController.getMyProfile);
router.patch('/me/profile', verifySession, usersController.updateMyProfile);
router.patch('/me/security', verifySession, usersController.updateMySecurity);
router.get('/me/orders', verifySession, usersController.getMyOrders);
router.get('/me/orders/:orderId/ticket', verifySession, usersController.getMyOrderTicket);
router.get('/me/loyalty', verifySession, usersController.getMyLoyaltyInfo);
router.get('/me/loyalty/ledgers', verifySession, usersController.getMyLoyaltyLedgers);
router.get('/me/movie-subscriptions', verifySession, usersController.getMyMovieSubscriptions);

// --- Géneros Favoritos del Cliente
router.get('/me/movie-genres', verifySession, usersController.getMyMovieGenres);
router.post('/me/movie-genres', verifySession, usersController.addMyMovieGenres);
router.delete('/me/movie-genres', verifySession, usersController.removeMyMovieGenres);

// --- Exclusivo para Gerencia
router.get('/', ...managerMiddleware, usersController.getAllUsers);
router.get('/:id/role', ...managerMiddleware, usersController.getUserRole);
router.post('/:id/role', ...managerMiddleware, usersController.assignUserRole);
router.delete('/:id/role', ...managerMiddleware, usersController.removeUserRole);
router.get('/:id/permissions', ...managerMiddleware, usersController.getUserPermissions);
router.post('/:id/permissions', ...managerMiddleware, usersController.assignUserPermissions);
router.delete('/:id/permissions', ...managerMiddleware, usersController.removeUserPermissions);
router.patch('/:id/status', ...managerMiddleware, usersController.changeUserStatus);

export default router;
