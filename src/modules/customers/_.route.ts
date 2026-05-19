import { Router } from 'express';
import customersController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, verifyPermission('CUSTOMERS:READ'), customersController.findAll);
router.post('/', verifySession, verifyPermission('CUSTOMERS:CREATE'), customersController.create);
router.get('/:id', verifySession, verifyPermission('CUSTOMERS:READ'), customersController.findById);
router.put('/:id', verifySession, verifyPermission('CUSTOMERS:UPDATE'), customersController.update);
router.patch(
    '/:id/loyalty-points',
    verifySession,
    verifyPermission('CUSTOMERS:ADJUST_POINTS'),
    customersController.adjustLoyaltyPoints,
);

export default router;
