import { Router } from 'express';
import roomsController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

router.get('/:id', verifySession, roomsController.findById);
router.put('/:id', verifySession, verifyRole(adminRoles), roomsController.update);
router.delete('/:id', verifySession, verifyRole(['SUPER_ADMIN']), roomsController.remove);

// Distribución y estado de asientos (HU-OPERATIVA-09, 10, 11)
router.put('/:id/seat-grid', verifySession, verifyRole(adminRoles), roomsController.configureSeatGrid);
router.get('/:id/seats', verifySession, roomsController.findSeats);
router.patch('/:id/seats/disable', verifySession, verifyRole(adminRoles), roomsController.disableSeats);
router.patch('/:id/seats/enable', verifySession, verifyRole(adminRoles), roomsController.enableSeats);

export default router;
