import { Router } from 'express';
import roomsController from './_.controller.js';
import { verifySession } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, roomsController.findAll);
router.get('/:id', verifySession, roomsController.findById);
router.post('/', verifySession, roomsController.create);
router.put('/:id', verifySession, roomsController.update);
router.delete('/:id', verifySession, roomsController.delete);

export default router;
