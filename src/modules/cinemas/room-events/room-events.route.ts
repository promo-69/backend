import { Router } from 'express';
import cinemaRoomEventsController from './room-events.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/', verifySession, verifyPermission('CRUD:READ:CINEMAS-ROOM-EVENTS'), cinemaRoomEventsController.findAll);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:CINEMAS-ROOM-EVENTS'), cinemaRoomEventsController.create);

export default router;
