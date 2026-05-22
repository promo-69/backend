import { Router } from 'express';
import employeesController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, verifyPermission('CRUD:READ:EMPLOYEES'), employeesController.findAll);
router.get('/:id', verifySession, verifyPermission('CRUD:READ:EMPLOYEES'), employeesController.findById);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:EMPLOYEES'), employeesController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:EMPLOYEES'), employeesController.update);

router.patch(
    '/:id/position',
    verifySession,
    verifyPermission('FEAT:CHANGE:EMPLOYEES_POSITION'),
    employeesController.changePosition,
);

router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:EMPLOYEES'), employeesController.delete);

export default router;
