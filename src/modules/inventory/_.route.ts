import { Router } from 'express';
import inventoryController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// GET /inventory — stock de la sede del usuario (cinemaId del JWT)
router.get('/', verifySession, verifyPermission('CRUD:READ:INVENTORY'), inventoryController.findAll);

// GET /inventory/:id — detalle del registro + movimientos
router.get('/:id', verifySession, verifyPermission('CRUD:READ:INVENTORY'), inventoryController.findById);

// POST /inventory/:id/movements — registrar movimientos
router.post(
    '/:id/movements',
    verifySession,
    verifyPermission('CRUD:CREATE:INVENTORY_MOVEMENT'),
    inventoryController.addMovements,
);

export default router;
