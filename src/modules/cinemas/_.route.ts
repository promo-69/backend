import { Router } from 'express';
import cinemasController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import roomsRouter from './rooms.route.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

router.get('/', verifySession, cinemasController.findAll);
router.get('/:id', verifySession, cinemasController.findById);
router.post('/', verifySession, /* verifyRole(adminRoles), */ cinemasController.create);
router.put('/:id', verifySession, /* verifyRole(adminRoles), */ cinemasController.update);
router.delete('/:id', verifySession, /* verifyRole(['SUPER_ADMIN']), */ cinemasController.remove);

// Montar el subrouter de salas en la ruta /:cinemaId/rooms
router.use('/:cinemaId/rooms', roomsRouter); // ← línea clave

export default router;
