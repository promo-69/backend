import { Router } from 'express';
import showtimesController from './_.controller.js';
import { verifySession, optionalAuth, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// Rutas estáticas / fijas

// Rutas públicas fijas
router.get('/billboard', optionalAuth, showtimesController.getBillboard);
router.get('/', optionalAuth, showtimesController.findAll);

// Rutas administrativas fijas (Backoffice)
router.get(
	'/admin/movies',
	verifySession,
	verifyPermission('CRUD:READ:SHOWTIMES'),
	showtimesController.getAllMoviesByLifecycle,
);

router.get('/admin', verifySession, verifyPermission('CRUD:READ:SHOWTIMES'), showtimesController.getAllShowtimesAdmin);

router.get(
	'/admin/movies/:movieId/showtimes',
	verifySession,
	verifyPermission('CRUD:READ:SHOWTIMES'),
	showtimesController.getShowtimesByMovieAdmin,
);

router.get(
	'/admin/cinemas/:cinemaId/showtimes',
	verifySession,
	verifyPermission('CRUD:READ:SHOWTIMES'),
	showtimesController.getShowtimesByCinemaAdmin,
);

router.post('/', verifySession, verifyPermission('CRUD:CREATE:SHOWTIMES'), showtimesController.create);

// 2 Rutas dinámicas con parámetros

// Detalle de una función específica.
router.get('/:id', optionalAuth, showtimesController.findById);

// Estado en vivo de los asientos (sold, locked)
router.get('/:id/seats-status', optionalAuth, showtimesController.getSeatsStatus);

// Mapa de asientos de una función
router.get('/:id/seat-map', optionalAuth, showtimesController.getSeatMap);

// Modificación y eliminación
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:SHOWTIMES'), showtimesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:SHOWTIMES'), showtimesController.remove);

export default router;
