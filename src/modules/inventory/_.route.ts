import { Router } from 'express';
import inventoryController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, verifyPermission('CRUD:READ:INVENTORY'), inventoryController.findAll);
router.get('/:id', verifySession, verifyPermission('CRUD:READ:INVENTORY'), inventoryController.findById);
router.post(
    '/:id/movements',
    verifySession,
    verifyPermission('CRUD:CREATE:INVENTORY_MOVEMENT'),
    inventoryController.addMovements,
);

export default router;
