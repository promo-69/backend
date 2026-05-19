import { Router } from 'express';
import employeesController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, verifyPermission('EMPLOYEES:READ'), employeesController.findAll);
router.get('/:id', verifySession, verifyPermission('EMPLOYEES:READ'), employeesController.findById);
router.post('/', verifySession, verifyPermission('EMPLOYEES:CREATE'), employeesController.create);
router.put('/:id', verifySession, verifyPermission('EMPLOYEES:UPDATE'), employeesController.update);
router.put(
    '/:id/position',
    verifySession,
    verifyPermission('EMPLOYEES:CHANGE_POSITION'),
    employeesController.changePosition,
);
router.delete('/:id', verifySession, verifyPermission('EMPLOYEES:DELETE'), employeesController.delete);

export default router;
