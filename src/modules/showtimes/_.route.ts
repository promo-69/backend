import { Router } from 'express';
import showtimesController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();
const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

router.get('/', showtimesController.findAll);
router.get('/:id', showtimesController.findById);
router.post('/', verifySession, verifyRole(adminRoles), showtimesController.create);
router.put('/:id', verifySession, verifyRole(adminRoles), showtimesController.update);
router.delete('/:id', verifySession, verifyRole(adminRoles), showtimesController.cancel);

export default router;
