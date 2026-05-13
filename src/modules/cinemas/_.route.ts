import { Router } from 'express';
import cinemasController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import roomsRouter from './rooms.route.js';
import { MiddlewareHandler } from '@rules/api.type.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];
const middlewares = [verifySession, verifyRole(adminRoles)];

router.get('/', ...middlewares, cinemasController.findAll);
router.get('/:id', ...middlewares, cinemasController.findById);
router.post('/', ...middlewares, cinemasController.create);
router.put('/:id', ...middlewares, cinemasController.update);
router.delete('/:id', ...middlewares, cinemasController.remove);

// Montar el subrouter de salas en la ruta /:cinemaId/rooms
router.use('/:cinemaId/rooms', roomsRouter); // ← línea clave

export default router;
