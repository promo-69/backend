import { Router } from 'express';
import roomsController from './_.controller.js';
import seatsController from '../seats/_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

// Salas
router.get('/:id', verifySession, roomsController.findById);
router.put('/:id', verifySession, /* verifyRole(adminRoles), */ roomsController.update);
router.delete('/:id', verifySession, /* verifyRole(['SUPER_ADMIN']), */ roomsController.remove);

// Asientos de una sala
router.get('/:id/seats', verifySession, roomsController.getSeatMap);
router.post('/:id/seats', verifySession, /* verifyRole(adminRoles), */ seatsController.create);

export default router;
