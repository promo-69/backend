import { Router } from 'express';
import employeesController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import { MiddlewareHandler } from '@rules/api.type.js';

const router = Router();
const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];
const middlewares: MiddlewareHandler[] = []; //verifySession];

router.get('/', verifySession, verifyRole(adminRoles), employeesController.findAll);
router.get('/:id', verifySession, verifyRole(adminRoles), employeesController.findById);
router.post('/', verifySession, verifyRole(adminRoles), employeesController.create);
router.put('/:id', verifySession, verifyRole(adminRoles), employeesController.update);
router.delete('/:id', verifySession, verifyRole(['SUPER_ADMIN']), employeesController.delete);
router.put('/:id/positions', verifySession, verifyRole(adminRoles), employeesController.changePosition);

export default router;
