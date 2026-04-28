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

// --- Password Reset ---
router.post('/forgot-password', preventAuthenticatedAccess, authController.forgotPassword);
router.post('/verify-reset-code', preventAuthenticatedAccess, authController.verifyResetCode);
router.post('/reset-password', preventAuthenticatedAccess, authController.resetPassword);

export default router;
