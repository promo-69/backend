import { Router } from 'express';
import inventoryController from '../inventory/_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });
// GET /cinemas/:cinemaId/inventory — auditoría remota
router.get('/', verifySession, verifyPermission('CRUD:READ:INVENTORY'), inventoryController.findAll);

// POST /cinemas/:cinemaId/inventory/:id/movements — reabastecimiento desde almacén central
router.post(
    '/:id/movements',
    verifySession,
    verifyPermission('CRUD:CREATE:INVENTORY_MOVEMENT'),
    inventoryController.addMovements,
);

export default router;
