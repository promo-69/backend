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

// Rutas estáticas

// Catálogo general (todos los estados visibles)
router.get('/', optionalAuth, moviesController.findAll);

// Con funciones embebidas
router.get('/showtimes', optionalAuth, moviesController.findWithShowtimes);

// lifecycle_state = 1 — Próximamente
router.get('/upcoming', optionalAuth, moviesController.upcoming);

// lifecycle_state = 2 — En Cartelera (Estreno)
router.get('/premiere', optionalAuth, moviesController.premiere);

// lifecycle_state = 3 — En Cartelera (Regular)
router.get('/now-playing', optionalAuth, moviesController.nowPlaying);

// lifecycle_state = 4 — Últimos Días
router.get('/last-days', optionalAuth, moviesController.lastDays);

// Admin: crear película
router.post('/', verifySession, verifyPermission('CRUD:UPDATE:MOVIES'), imageUpload, moviesController.create);

// Rutas dinámicas
router.get('/:id', optionalAuth, moviesController.findById);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:MOVIES'), imageUpload, moviesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:MOVIES'), moviesController.remove);

export default router;
