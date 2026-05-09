import { Router } from 'express';
import concessionsController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();
const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

// Products
router.get('/products', concessionsController.findAllProducts);
router.get('/products/:id', concessionsController.findProductById);
router.post('/products', /* verifySession, verifyRole(adminRoles), */ concessionsController.createProduct);
router.put('/products/:id', /* verifySession, verifyRole(adminRoles), */ concessionsController.updateProduct);

// Combos
router.get('/combos', concessionsController.findAllCombos);
router.get('/combos/:id', concessionsController.findComboById);
router.post('/combos', verifySession, /* verifyRole(adminRoles), */ concessionsController.createCombo);
router.put('/combos/:id', verifySession, /* verifyRole(adminRoles), */ concessionsController.updateCombo);

// Inventario por sucursal
router.get('/inventory/:cinemaId', /* verifySession, */ concessionsController.findInventoryByCinema);
router.post(
    '/inventory/:cinemaId/products/:productId/replenish',
    verifySession,
    /* verifyRole(adminRoles), */
    concessionsController.replenishInventory,
);

export default router;
