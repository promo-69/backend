import { Router } from 'express';
import priceModifiersController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

// POST   /api/v1/price-modifiers
router.post('/', verifySession, /* verifyRole(adminRoles), */ priceModifiersController.create);

// PUT    /api/v1/price-modifiers/:id
router.put('/:id', verifySession, /* verifyRole(adminRoles), */ priceModifiersController.update);

// DELETE /api/v1/price-modifiers/:id
router.delete('/:id', verifySession, /* verifyRole(['SUPER_ADMIN']), */ priceModifiersController.remove);

export default router;
