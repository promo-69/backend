import { Router } from 'express';
import customersController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, verifyPermission('CRUD:READ:CUSTOMERS'), customersController.findAll);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:CUSTOMERS'), customersController.create);
router.get('/:id', verifySession, verifyPermission('CRUD:READ:CUSTOMERS'), customersController.findById);
router.put('/:id', verifySession, verifyPermission('CRUD:UPDATE:CUSTOMERS'), customersController.update);
router.patch(
    '/:id/loyalty-points',
    verifySession,
    verifyPermission('CRUD:ADJUST_POINTS:CUSTOMERS'),
    customersController.adjustLoyaltyPoints,
);

export default router;
