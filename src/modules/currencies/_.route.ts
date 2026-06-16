import { Router } from 'express';
import currenciesController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// GET    /api/v1/currencies
router.get('/', verifySession, verifyPermission('CRUD:READ:CURRENCIES'), currenciesController.findAll);
// GET    /api/v1/currencies/:id
router.get('/:id', verifySession, verifyPermission('CRUD:READ:CURRENCIES'), currenciesController.findById);
// POST   /api/v1/currencies
router.post('/', verifySession, verifyPermission('CRUD:CREATE:CURRENCIES'), currenciesController.create);
// PATCH  /api/v1/currencies/:id
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:CURRENCIES'), currenciesController.update);
// DELETE /api/v1/currencies/:id
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:CURRENCIES'), currenciesController.remove);

export default router;
