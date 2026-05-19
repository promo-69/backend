import { Router } from 'express';
import cinemasController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import roomsRouter from './rooms.route.js';

const router = Router();

// Públicos
router.get('/', cinemasController.findAll);
router.get('/:id', cinemasController.findById);

// Protegidos — gerencia general
router.post('/', verifySession, /* verifyPermission('CRUD:CREATE:CINEMAS'), */ cinemasController.create);
router.put('/:id', verifySession, /* verifyPermission('CRUD:UPDATE:CINEMAS'), */ cinemasController.update);
router.patch(
    '/:id/status',
    verifySession,
    /* verifyPermission('CRUD:UPDATE_STATUS:CINEMAS'), */ cinemasController.setStatus,
);

// Contexto implícito — gerente de sede
router.put('/', verifySession, cinemasController.updateOwnCinema);

// Contexto explícito — empleados
router.get('/:cinemaId/employees', verifySession, cinemasController.findEmployeesByCinema);
router.post('/:cinemaId/employees', verifySession, cinemasController.createEmployeeInCinema);

// Subrouter de salas
router.use('/:cinemaId/rooms', roomsRouter);

export default router;
