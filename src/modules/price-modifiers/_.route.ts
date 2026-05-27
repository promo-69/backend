import { Router } from 'express';
import priceModifiersController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// GET    /api/v1/price-modifiers
router.get('/', verifySession, verifyPermission('CRUD:READ:PRICE-MODIFIERS'), priceModifiersController.findAll);

// GET    /api/v1/price-modifiers/:id
router.get('/:id', verifySession, verifyPermission('CRUD:READ:PRICE-MODIFIERS'), priceModifiersController.findById);

// POST   /api/v1/price-modifiers
router.post('/', verifySession, verifyPermission('CRUD:CREATE:PRICE-MODIFIERS'), priceModifiersController.create);

// PUT    /api/v1/price-modifiers/:id
router.put('/:id', verifySession, verifyPermission('CRUD:UPDATE:PRICE-MODIFIERS'), priceModifiersController.update);

// DELETE /api/v1/price-modifiers/:id
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:PRICE-MODIFIERS'), priceModifiersController.remove);

export default router;
