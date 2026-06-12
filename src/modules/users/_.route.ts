import { Router } from 'express';
import usersController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// --- Perfil del Usuario Logueado)
router.get('/me', verifySession, usersController.getMyProfile);
router.patch('/me/profile', verifySession, usersController.updateMyProfile);
router.patch('/me/security', verifySession, usersController.updateMySecurity);
router.get('/me/orders', verifySession, usersController.getMyOrders);
router.get('/me/orders/:orderId/ticket', verifySession, usersController.getMyOrderTicket);
router.get('/me/loyalty', verifySession, usersController.getMyLoyaltyInfo);
router.get('/me/loyalty/ledgers', verifySession, usersController.getMyLoyaltyLedgers);
router.get('/me/movie-subscriptions', verifySession, usersController.getMyMovieSubscriptions);
router.post('/me/movie-subscriptions', verifySession, usersController.addMyMovieSubscriptions);
router.delete('/me/movie-subscriptions/:movieId', verifySession, usersController.removeMyMovieSubscription);
// --- Géneros Favoritos del Cliente
router.get('/me/movie-genres', verifySession, usersController.getMyMovieGenres);
router.post('/me/movie-genres', verifySession, usersController.addMyMovieGenres);
router.delete('/me/movie-genres/:genreId', verifySession, usersController.removeMyMovieGenres);
// --- Exclusivo para Gerencia
router.get('/', verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS']), usersController.getAllUsers);
router.get('/:id/role', verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS']), usersController.getUserRole);
router.post('/:id/role', verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS']), usersController.assignUserRole);
router.delete('/:id/role', verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS']), usersController.removeUserRole);
router.get('/:id/permissions', verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS']), usersController.getUserPermissions);
router.post('/:id/permissions', verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS']), usersController.assignUserPermissions);
router.delete('/:id/permissions', verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS']), usersController.removeUserPermissions);
router.patch('/:id/status', verifySession, verifyPermission(['FEAT:DO:MANAGE_USERS']), usersController.changeUserStatus);

export default router;
