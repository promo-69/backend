import { Router } from 'express';
import cinemaShowtimesController from './showtimes.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/', verifySession, verifyPermission('CRUD:READ:CINEMAS-SHOWTIMES'), cinemaShowtimesController.findAll);
router.post('/', verifySession, verifyPermission('CRUD:CREATE:CINEMAS-SHOWTIMES'), cinemaShowtimesController.create);

export default router;
