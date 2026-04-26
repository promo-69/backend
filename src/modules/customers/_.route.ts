import { Router } from 'express';
import customersController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

// PATCH /api/v1/customers/:id/loyalty-points
router.patch(
    '/:id/loyalty-points',
    verifySession,
    /* verifyRole(adminRoles), */ customersController.adjustLoyaltyPoints,
);

export default router;
