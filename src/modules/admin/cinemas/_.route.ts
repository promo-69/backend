import { Router } from 'express';
import cinemasController from './_.controller.js';
import { verifySession } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, cinemasController.findAll);
router.get('/:id', verifySession, cinemasController.findById);
router.post('/', verifySession, cinemasController.create);
router.put('/:id', verifySession, cinemasController.update);
router.delete('/:id', verifySession, cinemasController.delete);

export default router;
