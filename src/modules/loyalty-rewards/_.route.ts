import { Router } from 'express';
import loyaltyRewardsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// ------- Cliente -------

// GET  /api/v1/loyalty-rewards/available  -> catálogo agrupado por nivel
router.get('/available', verifySession, loyaltyRewardsController.available);

// POST /api/v1/loyalty-rewards/:id/redeem -> canje del premio
router.post('/:id/redeem', verifySession, loyaltyRewardsController.redeem);

// ------- Admin (backoffice / fidelización) -------

// GET    /api/v1/loyalty-rewards
router.get('/', verifySession, verifyPermission('CRUD:READ:LOYALTY-REWARDS'), loyaltyRewardsController.findAll);

// GET    /api/v1/loyalty-rewards/:id
router.get('/:id', verifySession, verifyPermission('CRUD:READ:LOYALTY-REWARDS'), loyaltyRewardsController.findById);

// POST   /api/v1/loyalty-rewards
router.post('/', verifySession, verifyPermission('CRUD:CREATE:LOYALTY-REWARDS'), loyaltyRewardsController.create);

// PUT    /api/v1/loyalty-rewards/:id
router.put('/:id', verifySession, verifyPermission('CRUD:UPDATE:LOYALTY-REWARDS'), loyaltyRewardsController.update);

// DELETE /api/v1/loyalty-rewards/:id
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:LOYALTY-REWARDS'), loyaltyRewardsController.remove);

export default router;
