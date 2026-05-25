import { Router } from 'express';
import cinemaInventoryController from './inventory.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// GET /cinemas/:cinemaId/inventory — auditoría remota (contexto explícito)
router.get('/', verifySession, verifyPermission('CRUD:READ:CINEMAS-INVENTORY'), cinemaInventoryController.findAll);

// POST /cinemas/:cinemaId/inventory/:id/movements — reabastecimiento desde almacén central
router.post(
    '/:id/movements',
    verifySession,
    verifyPermission('CRUD:CREATE:INVENTORY_MOVEMENT'),
    cinemaInventoryController.addMovements,
);

export default router;
