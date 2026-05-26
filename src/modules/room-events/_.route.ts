import { Router } from 'express';
import roomEventsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, verifyPermission('CRUD:READ:ROOM-EVENTS'), roomEventsController.findAll);
router.get('/:id', verifySession, verifyPermission('CRUD:READ:ROOM-EVENTS'), roomEventsController.findById);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:ROOM-EVENTS'), roomEventsController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:ROOM-EVENTS'), roomEventsController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:ROOM-EVENTS'), roomEventsController.remove);

export default router;
