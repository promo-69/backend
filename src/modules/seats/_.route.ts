import { Router } from 'express';
import seatsController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

// PATCH /api/v1/seats/:id  — actualizar condición/categoría (HU-OPERATIVA-10, HU-OPERATIVA-11)
router.patch('/:id', verifySession, /* verifyRole(adminRoles), */ seatsController.update);

// DELETE /api/v1/seats/:id  — soft delete (HU-OPERATIVA-09 Remoción)
router.delete('/:id', verifySession, /* verifyRole(['SUPER_ADMIN']), */ seatsController.remove);

export default router;
