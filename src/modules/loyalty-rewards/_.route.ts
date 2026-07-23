import { Router } from 'express';
import loyaltyRewardsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// ------- Cliente -------
router.get('/available', verifySession, loyaltyRewardsController.available);
router.post('/:id/redeem', verifySession, loyaltyRewardsController.redeem);

// ------- Admin -------
router.get('/', verifySession, verifyPermission('CRUD:READ:LOYALTY-REWARDS'), loyaltyRewardsController.findAll);
router.get('/:id', verifySession, verifyPermission('CRUD:READ:LOYALTY-REWARDS'), loyaltyRewardsController.findById);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:LOYALTY-REWARDS'), loyaltyRewardsController.create);
router.put('/:id', verifySession, verifyPermission('CRUD:UPDATE:LOYALTY-REWARDS'), loyaltyRewardsController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:LOYALTY-REWARDS'), loyaltyRewardsController.remove);

export default router;
