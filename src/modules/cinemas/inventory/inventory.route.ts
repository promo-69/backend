import { Router } from 'express';
import cinemaInventoryController from './inventory.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/', verifySession, verifyPermission('CRUD:READ:INVENTORY'), cinemaInventoryController.findAll);
router.post(
    '/:id/movements',
    verifySession,
    verifyPermission('CRUD:CREATE:INVENTORY_MOVEMENT'),
    cinemaInventoryController.addMovements,
);

export default router;
