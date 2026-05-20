import { Router } from 'express';
import seatsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// GET /api/v1/seats/:id
router.get('/:id', verifySession, /* verifyPermission('CRUD:READ:SEATS'), */ seatsController.findById);

// PATCH /api/v1/seats/:id
router.patch('/:id', verifySession, /* verifyPermission('CRUD:UPDATE:SEATS'), */ seatsController.update);

// DELETE /api/v1/seats/:id
router.delete('/:id', verifySession, /* verifyPermission('CRUD:DELETE:SEATS'), */ seatsController.remove);

export default router;
