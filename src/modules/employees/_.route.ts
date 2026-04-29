import { Router } from 'express';
import employeesController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import { MiddlewareHandler } from '@rules/api.type.js';

const router = Router();
const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];
const middlewares: MiddlewareHandler[] = []; //verifySession];

router.get('/', middlewares, verifyRole(adminRoles), employeesController.findAll);
router.get('/:id', middlewares, verifyRole(adminRoles), employeesController.findById);
router.post('/', middlewares, verifyRole(adminRoles), employeesController.create);
router.put('/:id', middlewares, verifyRole(adminRoles), employeesController.update);
router.delete('/:id', middlewares, verifyRole(['SUPER_ADMIN']), employeesController.delete);
router.put('/:id/positions', middlewares, verifyRole(adminRoles), employeesController.changePosition);

export default router;
