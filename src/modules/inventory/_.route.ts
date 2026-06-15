import { Router } from 'express';
import inventoryController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// =============================================================================
//  RUTAS ESTÁTICAS — antes de /:id para evitar colisiones
// =============================================================================

// GET /inventory/admin/all — listado global de backoffice (todas las sucursales)
router.get(
    '/admin/all',
    verifySession,
    verifyPermission('CRUD:READ:CINEMAS-INVENTORY'),
    inventoryController.findAllAdmin,
);

// GET /inventory/products/:productId — ficha de producto + stock en la sucursal del usuario
router.get(
    '/products/:productId',
    verifySession,
    verifyPermission('CRUD:READ:INVENTORY'),
    inventoryController.findProductStock,
);

// POST /inventory/products/:productId — habilita un producto en el inventario de la sucursal
router.post(
    '/products/:productId',
    verifySession,
    verifyPermission('CRUD:CREATE:INVENTORY_MOVEMENT'),
    inventoryController.provisionProduct,
);

// GET /inventory — stock de la sede del usuario (cinemaId del JWT)
router.get('/', verifySession, verifyPermission('CRUD:READ:INVENTORY'), inventoryController.findAll);

// =============================================================================
//  RUTAS DINÁMICAS — con :id, siempre al final
// =============================================================================

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
