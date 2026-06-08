import { Router } from 'express';
import cinemaShowtimesController from './showtimes.controller.js';
import { optionalAuth, verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// =============================================================================
//  RUTAS ESTÁTICAS — siempre antes de las dinámicas con :id
// =============================================================================

// GET /cinemas/:cinemaId/showtimes/billboard?movieId=&projectionType=&language=
router.get('/billboard', optionalAuth, cinemaShowtimesController.getBillboardByCinema);

// GET /cinemas/:cinemaId/showtimes/movies/:movieId
router.get('/movies/:movieId', optionalAuth, cinemaShowtimesController.getMovieShowtimes);

// GET /cinemas/:cinemaId/showtimes?date=&startDate=&endDate=&onlyFuture=
router.get('/', optionalAuth, cinemaShowtimesController.findAll);

// POST /cinemas/:cinemaId/showtimes
router.post(
    '/',
    verifySession,
    verifyPermission('CRUD:CREATE:SHOWTIMES'),
    cinemaShowtimesController.create,
);

// =============================================================================
//  RUTAS DINÁMICAS — con :id, siempre al final
// =============================================================================

// GET /cinemas/:cinemaId/showtimes/:id
router.get('/:id', optionalAuth, cinemaShowtimesController.findById);

// GET /cinemas/:cinemaId/showtimes/:id/seat-map
router.get('/:id/seat-map', optionalAuth, cinemaShowtimesController.getSeatMap);

export default router;
