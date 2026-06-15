import { Router } from 'express';
import cinemaInventoryController from './inventory.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// =============================================================================
//  RUTAS ESTÁTICAS — antes de /:id para evitar colisiones
// =============================================================================

// GET /cinemas/:cinemaId/inventory/products/:productId — ficha de producto + stock
router.get(
    '/products/:productId',
    verifySession,
    verifyPermission('CRUD:READ:CINEMAS-INVENTORY'),
    cinemaInventoryController.findProductStock,
);

// POST /cinemas/:cinemaId/inventory/products/:productId — habilita un producto en la sucursal
router.post(
    '/products/:productId',
    verifySession,
    verifyPermission('CRUD:CREATE:CINEMAS-INVENTORY'),
    cinemaInventoryController.provisionProduct,
);

// GET /cinemas/:cinemaId/inventory — auditoría remota (contexto explícito)
router.get('/', verifySession, verifyPermission('CRUD:READ:CINEMAS-INVENTORY'), cinemaInventoryController.findAll);

// =============================================================================
//  RUTAS DINÁMICAS — con :id, siempre al final
// =============================================================================

// GET /cinemas/:cinemaId/inventory/:id — detalle del registro + movimientos
router.get('/:id', verifySession, verifyPermission('CRUD:READ:CINEMAS-INVENTORY'), cinemaInventoryController.findById);

// POST /cinemas/:cinemaId/inventory/:id/movements — reabastecimiento desde almacén central
router.post(
    '/:id/movements',
    verifySession,
    verifyPermission('CRUD:CREATE:INVENTORY_MOVEMENT'),
    cinemaInventoryController.addMovements,
);

export default router;
