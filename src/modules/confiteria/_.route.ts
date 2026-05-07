import { Router } from 'express';
import confiteriaController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();
const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

// Products
router.get('/products', confiteriaController.findAllProducts);
router.get('/products/:id', confiteriaController.findProductById);
router.post('/products', verifySession, verifyRole(adminRoles), confiteriaController.createProduct);
router.put('/products/:id', verifySession, verifyRole(adminRoles), confiteriaController.updateProduct);

// Combos
router.get('/combos', confiteriaController.findAllCombos);
router.get('/combos/:id', confiteriaController.findComboById);
router.post('/combos', verifySession, verifyRole(adminRoles), confiteriaController.createCombo);
router.put('/combos/:id', verifySession, verifyRole(adminRoles), confiteriaController.updateCombo);

// Inventario por sucursal
router.get('/inventory/:cinemaId', verifySession, confiteriaController.findInventoryByCinema);
router.post(
    '/inventory/:cinemaId/products/:productId/replenish',
    verifySession,
    verifyRole(adminRoles),
    confiteriaController.replenishInventory,
);

export default router;
