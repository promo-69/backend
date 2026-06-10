import { Router } from 'express';
import seatsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/:id', verifySession, verifyPermission('CRUD:READ:SEATS'), seatsController.findById);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:SEATS'), seatsController.update);
router.delete('/room/:roomId', verifySession, verifyPermission('CRUD:DELETE:SEATS'), seatsController.removeByRoom);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:SEATS'), seatsController.remove);

export default router;
