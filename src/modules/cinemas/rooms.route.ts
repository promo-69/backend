import { Router } from 'express';
import roomsController from '../rooms/_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import { MiddlewareHandler } from '@rules/api.type.js';

const router = Router({ mergeParams: true }); // hereda :cinemaId del router padre

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];
const middlewares = [verifySession, verifyRole(adminRoles)];

router.get('/', ...middlewares, roomsController.findAll);
router.post('/', ...middlewares, roomsController.create);

export default router;
