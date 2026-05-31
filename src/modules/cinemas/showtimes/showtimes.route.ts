import { Router } from 'express';
import cinemaShowtimesController from './showtimes.controller.js';
import { verifySession, optionalAuth, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// Rutas públicas
// GET /cinemas/:cinemaId/showtimes/billboard
// Cartelera pública de una sucursal.
router.get('/billboard', optionalAuth, cinemaShowtimesController.getBillboardByCinema);

// GET /cinemas/:cinemaId/showtimes/movies/:movieId
// Funciones de una película en la sucursal con asientos disponibles.
router.get('/movies/:movieId', optionalAuth, cinemaShowtimesController.getMovieShowtimes);

// GET /cinemas/:cinemaId/showtimes
// Funciones disponibles de una sucursal (futuras).
router.get('/', optionalAuth, cinemaShowtimesController.findAll);

// GET /cinemas/:cinemaId/showtimes/:id
// Detalle de una función específica en la sucursal.
router.get('/:id', optionalAuth, cinemaShowtimesController.findById);

// Rutas privadas
router.post('/', verifySession, verifyPermission('CRUD:CREATE:CINEMAS-SHOWTIMES'), cinemaShowtimesController.create);

// GET /cinemas/:cinemaId/showtimes/:id/seat-map
// Mapa de asientos en tiempo real. Público con auth opcional.
router.get('/:id/seat-map', optionalAuth, cinemaShowtimesController.getSeatMap);

export default router;
