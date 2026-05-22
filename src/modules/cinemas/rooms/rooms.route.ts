import { Router } from 'express';
import cinemaRoomsController from './rooms.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/', verifySession, verifyPermission('CRUD:READ:ROOMS'), cinemaRoomsController.findAll);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:ROOMS'), cinemaRoomsController.create);

export default router;
