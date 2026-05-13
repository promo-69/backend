import { Router } from 'express';
import concessionsController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();
const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

const imageUpload = uploadFields([{ name: 'image', maxCount: 1 }], {
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

// --- Product Categories ---
router.get('/categories', concessionsController.findAllCategories);
router.get('/categories/:id', concessionsController.findCategoryById);
router.post('/categories', verifySession, verifyRole(adminRoles), concessionsController.createCategory);
router.put('/categories/:id', verifySession, verifyRole(adminRoles), concessionsController.updateCategory);
router.delete('/categories/:id', verifySession, verifyRole(adminRoles), concessionsController.deleteCategory);

// --- Products ---
router.get('/products', concessionsController.findAllProducts);
router.get('/products/:id', concessionsController.findProductById);
router.post('/products', verifySession, verifyRole(adminRoles), imageUpload, concessionsController.createProduct);
router.put('/products/:id', verifySession, verifyRole(adminRoles), imageUpload, concessionsController.updateProduct);

// --- Combos ---
router.get('/combos', concessionsController.findAllCombos);
router.get('/combos/:id', concessionsController.findComboById);
router.post('/combos', verifySession, verifyRole(adminRoles), imageUpload, concessionsController.createCombo);
router.put('/combos/:id', verifySession, verifyRole(adminRoles), imageUpload, concessionsController.updateCombo);

// --- Inventory ---
router.get('/inventory/:cinemaId', verifySession, concessionsController.findInventoryByCinema);
router.get('/inventory/:cinemaId/grouped', verifySession, concessionsController.findInventoryGroupedByCategory);
router.post(
    '/inventory/:cinemaId/products/:productId/replenish',
    verifySession,
    verifyRole(adminRoles),
    concessionsController.replenishInventory,
);

export default router;
