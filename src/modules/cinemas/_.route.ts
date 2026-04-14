import { Router } from 'express';
import cinemasController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

router.get('/', verifySession, cinemasController.findAll);
router.get('/:id', verifySession, cinemasController.findById);
router.post('/', verifySession, cinemasController.create);
router.put('/:id', verifySession, cinemasController.update);
router.delete('/:id', verifySession, cinemasController.remove);

export default router;
