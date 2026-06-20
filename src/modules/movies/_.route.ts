import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth, verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();

const imageUpload = uploadFields(
    [
        { name: 'banner', maxCount: 1 },
        { name: 'poster', maxCount: 1 },
    ],
    { maxSizeMB: 25 },
);

// =============================================================================
//  RUTAS ESTÁTICAS GLOBALES — catálogo sin filtro de sucursal
// =============================================================================

// Catálogo completo
router.get('/', optionalAuth, moviesController.findAll);

// Con funciones embebidas
router.get('/showtimes', optionalAuth, moviesController.findWithShowtimes);

// lifecycle_state = 1 — Próximamente (global)
router.get('/upcoming', optionalAuth, moviesController.upcoming);

// lifecycle_state = 2 — En Cartelera (Estreno) global
router.get('/premiere', optionalAuth, moviesController.premiere);

// lifecycle_state = 3 — En Cartelera (Regular) global
router.get('/now-playing', optionalAuth, moviesController.nowPlaying);

// lifecycle_state = 4 — Últimos Días global
router.get('/last-days', optionalAuth, moviesController.lastDays);

// =============================================================================
//  RUTAS ESTÁTICAS POR SUCURSAL — /movies/by-cinema/:cinemaId/*
//  Cruzan lifecycle con funciones reales en esa sucursal.
//  Van antes de /:id para evitar colisiones.
// =============================================================================

// lifecycle_state = 1 por sucursal
router.get('/by-cinema/:cinemaId/upcoming', optionalAuth, moviesController.upcomingByCinema);

// lifecycle_state = 2 por sucursal
router.get('/by-cinema/:cinemaId/premiere', optionalAuth, moviesController.premiereByCinema);

// lifecycle_state = 3 por sucursal
router.get('/by-cinema/:cinemaId/now-playing', optionalAuth, moviesController.nowPlayingByCinema);

// lifecycle_state = 4 por sucursal
router.get('/by-cinema/:cinemaId/last-days', optionalAuth, moviesController.lastDaysByCinema);

// =============================================================================
//  CRUD — protegidos
// =============================================================================

router.post('/', verifySession, verifyPermission('CRUD:UPDATE:MOVIES'), imageUpload, moviesController.create);

// =============================================================================
//  RUTAS DINÁMICAS — con :id, siempre al final
// =============================================================================

router.get('/:id', optionalAuth, moviesController.findById);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:MOVIES'), imageUpload, moviesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:MOVIES'), moviesController.remove);

export default router;
