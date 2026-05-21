import { Router } from 'express';
import cinemasController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import roomsRouter from './rooms.route.js';
import inventoryRouter from './inventory.route.js';

const router = Router();

// Públicos
router.get('/', cinemasController.findAll);
router.get('/:id', cinemasController.findById);

// Protegidos — gerencia general
router.post('/', verifySession, verifyPermission('CRUD:CREATE:CINEMAS'), cinemasController.create);
router.put('/:id', verifySession, verifyPermission('CRUD:UPDATE:CINEMAS'), cinemasController.update);

// DELETE — soft delete via deleted_at
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:CINEMAS'), cinemasController.delete);

// Contexto implícito — gerente de sede
router.put('/', verifySession, cinemasController.updateOwnCinema);

// Empleados de una sucursal
router.get('/:cinemaId/employees', verifySession, cinemasController.findEmployeesByCinema);
router.post('/:cinemaId/employees', verifySession, cinemasController.createEmployeeInCinema);

// Subrouter de salas
router.use('/:cinemaId/rooms', roomsRouter);

// Subrouter de inventario
router.use('/:cinemaId/inventory', inventoryRouter);

export default router;
