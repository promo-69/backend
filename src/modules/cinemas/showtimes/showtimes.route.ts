import { Router } from 'express';
import cinemaShowtimesController from './showtimes.controller.js';
import { verifySession, optionalAuth, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// =============================================================================
// RUTAS PÚBLICAS
// =============================================================================

/**
 * GET /cinemas/:cinemaId/showtimes/billboard
 * Cartelera pública de una sucursal.
 */
router.get('/billboard', optionalAuth, cinemaShowtimesController.getBillboardByCinema);

/**
 * GET /cinemas/:cinemaId/showtimes/movies/:movieId
 * Funciones de una película en la sucursal con asientos disponibles.
 */
router.get('/movies/:movieId', optionalAuth, cinemaShowtimesController.getMovieShowtimes);

/**
 * GET /cinemas/:cinemaId/showtimes
 * Funciones disponibles de una sucursal (futuras).
 * Soporta:
 *   ?date=2026-06-15          → solo funciones de ese día
 *   ?date=2026-06-15&tz=America/Bogota → con zona horaria específica
 */
router.get('/', optionalAuth, cinemaShowtimesController.findAll);

/**
 * GET /cinemas/:cinemaId/showtimes/:id
 * Detalle de una función específica en la sucursal.
 */
router.get('/:id', optionalAuth, cinemaShowtimesController.findById);

// =============================================================================
// RUTAS PRIVADAS — backoffice
// =============================================================================

router.post('/', verifySession, verifyPermission('CRUD:CREATE:CINEMAS-SHOWTIMES'), cinemaShowtimesController.create);

export default router;
