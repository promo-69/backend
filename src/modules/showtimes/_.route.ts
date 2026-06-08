import { Router } from 'express';
import showtimesController from './_.controller.js';
import { verifySession, optionalAuth, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// =============================================================================
//  RUTAS ESTÁTICAS — deben ir antes de las dinámicas con :id
// =============================================================================

// Cartelera pública de películas
router.get('/billboard', optionalAuth, showtimesController.getBillboard);
// Cartelera unificada (películas y eventos especiales)
router.get('/billboard/unified', optionalAuth, showtimesController.getUnifiedBillboard);

// Listado público de funciones
router.get('/', optionalAuth, showtimesController.findAll);

// Admin: listado de películas por lifecycle
router.get(
    '/admin/movies',
    verifySession,
    verifyPermission('CRUD:READ:SHOWTIMES'),
    showtimesController.getAllMoviesByLifecycle,
);

// Admin: listado de todas las funciones con filtros
router.get('/admin', verifySession, verifyPermission('CRUD:READ:SHOWTIMES'), showtimesController.getAllShowtimesAdmin);

// Admin: funciones de una película específica
router.get(
    '/admin/movies/:movieId/showtimes',
    verifySession,
    verifyPermission('CRUD:READ:SHOWTIMES'),
    showtimesController.getShowtimesByMovieAdmin,
);

// Admin: funciones de una sucursal específica
router.get(
    '/admin/cinemas/:cinemaId/showtimes',
    verifySession,
    verifyPermission('CRUD:READ:SHOWTIMES'),
    showtimesController.getShowtimesByCinemaAdmin,
);

// Admin: funciones de un evento especial específico
router.get(
    '/admin/events/:eventId/showtimes',
    verifySession,
    verifyPermission('CRUD:READ:SHOWTIMES'),
    showtimesController.getShowtimesByEventAdmin,
);

// =============================================================================
//  RUTAS DINÁMICAS — con :id, siempre al final
// =============================================================================

// Detalle de una función
router.get('/:id', optionalAuth, showtimesController.findById);

// Mapa de asientos de una función (películas y eventos especiales)
router.get('/:id/seat-map', optionalAuth, showtimesController.getSeatMap);

// Editar función
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:SHOWTIMES'), showtimesController.update);

// Eliminar función
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:SHOWTIMES'), showtimesController.remove);

export default router;
