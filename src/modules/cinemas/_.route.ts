import { Router } from 'express';
import cinemasController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import roomsRouter from './rooms/rooms.route.js';
import inventoryRouter from './inventory/inventory.route.js';
import combosRouter from './combos/combos.route.js';
import showtimesRouter from './showtimes/showtimes.route.js';

const router = Router();

// Rutas estáticas específicas antes de los parámetros dinámicos
router.get('/rooms-available', verifySession, verifyPermission('CRUD:READ:CINEMAS'), cinemasController.findAllWithRooms);

// Públicos
router.get('/', cinemasController.findAll);
router.get('/:id', cinemasController.findById);

// Gerencia general
router.post('/', verifySession, verifyPermission('CRUD:CREATE:CINEMAS'), cinemasController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:CINEMAS'), cinemasController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:CINEMAS'), cinemasController.delete);

// Contexto implícito — gerente de sede
router.patch('/', verifySession, verifyPermission('CRUD:UPDATE_OWN:CINEMAS'), cinemasController.updateOwnCinema);

router.get(
    '/:cinemaId/employees',
    verifySession,
    verifyPermission('CRUD:READ:CINEMAS-EMPLOYEES'),
    cinemasController.findEmployeesByCinema,
);
router.post(
    '/:cinemaId/employees',
    verifySession,
    verifyPermission('CRUD:CREATE:EMPLOYEES'),
    cinemasController.createEmployeeInCinema,
);
router.delete(
    '/:cinemaId/employees/:employeeId',
    verifySession,
    verifyPermission('CRUD:DELETE:EMPLOYEES'),
    cinemasController.removeEmployeeFromCinema,
);

// Subrouters
router.use('/:cinemaId/rooms', roomsRouter);
router.use('/:cinemaId/inventory', inventoryRouter);
router.use('/:cinemaId/combos', combosRouter);
router.use('/:cinemaId/showtimes', showtimesRouter);

export default router;
