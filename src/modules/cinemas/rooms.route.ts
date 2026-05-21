import { Router } from 'express';
import roomsController from '../rooms/_.controller.js';
import { verifySession } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/', verifySession, verifyPermission('CRUD:READ:ROOMS'), roomsController.findAll);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:ROOMS'), roomsController.create);

export default router;
