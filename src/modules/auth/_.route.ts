import { Router } from 'express';
import authController from './_.controller.js';
import { preventAuthenticatedAccess, verifySession } from '@middlewares/auth.middleware.js';

const router = Router();

// --- Auth & Session ---
router.post('/signup', preventAuthenticatedAccess, authController.signup);
router.post('/verify-signup', preventAuthenticatedAccess, authController.verifySignup);
router.post('/login', preventAuthenticatedAccess, authController.login);
router.post('/login/admin', preventAuthenticatedAccess, authController.loginAdmin);
router.post('/refresh', authController.refresh);
router.post('/logout', verifySession, authController.logout);

// --- Password Reset ---
router.post('/forgot-password/:accountType', preventAuthenticatedAccess, authController.forgotPassword);
router.post('/verify-reset-code/:accountType', preventAuthenticatedAccess, authController.verifyResetCode);
router.post('/reset-password/:accountType', preventAuthenticatedAccess, authController.resetPassword);

export default router;
