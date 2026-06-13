import { Router } from 'express';
import specialEventsController from './_.controller.js';
import { optionalAuth, verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();

const imageUpload = uploadFields(
    [
        { name: 'banner', maxCount: 1 },
        { name: 'poster', maxCount: 1 },
    ],
    { maxSizeMB: 10 },
);

// =============================================================================
//  RUTAS ESTÁTICAS GLOBALES — catálogo sin filtro de sucursal
// =============================================================================

// GET /special-events/upcoming — lifecycle_state = 1 (global)
router.get('/upcoming', optionalAuth, specialEventsController.getUpcoming);

// GET /special-events/premiere — lifecycle_state = 2 (global)
router.get('/premiere', optionalAuth, specialEventsController.getOnPremiere);

// GET /special-events/now-playing — lifecycle_state = 3 (global)
router.get('/now-playing', optionalAuth, specialEventsController.getInBillboard);

// GET /special-events/last-days — lifecycle_state = 4 (global)
router.get('/last-days', optionalAuth, specialEventsController.getLastDays);

// GET /special-events/showtimes/billboard?cinemaId= — cartelera de funciones reales
router.get('/showtimes/billboard', optionalAuth, specialEventsController.getBillboard);

// GET /special-events — listado completo del catálogo
router.get('/', optionalAuth, specialEventsController.findAll);

// POST /special-events
router.post(
    '/',
    verifySession,
    verifyPermission('CRUD:CREATE:SPECIAL_EVENTS'),
    imageUpload,
    specialEventsController.create,
);

// =============================================================================
//  RUTAS POR SUCURSAL — /special-events/by-cinema/:cinemaId/*
//  Cruzan lifecycle con funciones reales en esa sucursal.
//  Deben ir ANTES de /:id para evitar colisiones.
// =============================================================================

// lifecycle_state = 1 por sucursal
router.get('/by-cinema/:cinemaId/upcoming', optionalAuth, specialEventsController.getUpcomingByCinema);

// lifecycle_state = 2 por sucursal
router.get('/by-cinema/:cinemaId/premiere', optionalAuth, specialEventsController.getOnPremiereByCinema);

// lifecycle_state = 3 por sucursal
router.get('/by-cinema/:cinemaId/now-playing', optionalAuth, specialEventsController.getInBillboardByCinema);

// lifecycle_state = 4 por sucursal
router.get('/by-cinema/:cinemaId/last-days', optionalAuth, specialEventsController.getLastDaysByCinema);

// =============================================================================
//  RUTAS ADMINISTRATIVAS ESTÁTICAS — antes de /:id y /admin/:id
// =============================================================================

// GET /special-events/admin/showtimes?cinemaId=&eventId=&startDate=&endDate=&onlyFuture=
router.get(
    '/admin/showtimes',
    verifySession,
    verifyPermission('CRUD:READ:SPECIAL_EVENTS'),
    specialEventsController.getAdminShowtimes,
);

// GET /special-events/admin
router.get('/admin', verifySession, verifyPermission('CRUD:READ:SPECIAL_EVENTS'), specialEventsController.findAllAdmin);

// =============================================================================
//  RUTAS DINÁMICAS — con :id, siempre al final
// =============================================================================

// GET /special-events/:id
router.get('/:id', optionalAuth, specialEventsController.findById);

// GET /special-events/:id/showtimes?cinemaId=
router.get('/:id/showtimes', optionalAuth, specialEventsController.getPublicShowtimes);

// GET /special-events/admin/:id
router.get(
    '/admin/:id',
    verifySession,
    verifyPermission('CRUD:READ:SPECIAL_EVENTS'),
    specialEventsController.findByIdAdmin,
);

// PATCH /special-events/:id
router.patch(
    '/:id',
    verifySession,
    verifyPermission('CRUD:UPDATE:SPECIAL_EVENTS'),
    imageUpload,
    specialEventsController.update,
);

// DELETE /special-events/:id
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:SPECIAL_EVENTS'), specialEventsController.remove);

export default router;
