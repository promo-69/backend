import { Router } from 'express';
import roomsController from '../rooms/_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true }); // hereda :cinemaId del router padre

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

router.get('/', verifySession, roomsController.findAll);
router.post('/', verifySession, verifyRole(adminRoles), roomsController.create);

export default router;
