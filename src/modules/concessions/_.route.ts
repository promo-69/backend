import { Router } from 'express';
import concessionsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();

const imageUpload = uploadFields([{ name: 'image', maxCount: 1 }], {
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

// --- Products (GET públicos) ---
router.get('/products', concessionsController.findAllProducts);
router.get('/products/:id', concessionsController.findProductById);

// --- Products (gestión interna) ---
router.post(
    '/products',
    verifySession,
    verifyPermission('CRUD:CREATE:PRODUCTS'),
    imageUpload,
    concessionsController.createProduct,
);
router.patch(
    '/products/:id',
    verifySession,
    verifyPermission('CRUD:UPDATE:PRODUCTS'),
    imageUpload,
    concessionsController.updateProduct,
);
router.delete(
    '/products/:id',
    verifySession,
    verifyPermission('CRUD:DELETE:PRODUCTS'),
    concessionsController.deleteProduct,
);

// --- Combos (GET públicos) ---
router.get('/combos', concessionsController.findAllCombos);
router.get('/combos/:id', concessionsController.findComboById);

// --- Combos (gestión interna) ---
router.post(
    '/combos',
    verifySession,
    verifyPermission('CRUD:CREATE:COMBOS'),
    imageUpload,
    concessionsController.createCombo,
);
router.patch(
    '/combos/:id',
    verifySession,
    verifyPermission('CRUD:UPDATE:COMBOS'),
    imageUpload,
    concessionsController.updateCombo,
);
router.delete('/combos/:id', verifySession, verifyPermission('CRUD:DELETE:COMBOS'), concessionsController.deleteCombo);

// --- Combo Items (BOM) ---
router.post(
    '/combos/:id/items',
    verifySession,
    verifyPermission('CRUD:MANAGE_COMBO_ITEMS:COMBOS'),
    concessionsController.addComboItems,
);
router.delete(
    '/combos/:id/items/:itemId',
    verifySession,
    verifyPermission('CRUD:MANAGE_COMBO_ITEMS:COMBOS'),
    concessionsController.removeComboItem,
);

export default router;
