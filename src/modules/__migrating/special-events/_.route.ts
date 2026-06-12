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
//  RUTAS ESTÁTICAS — todas antes de cualquier /:id para evitar colisiones
// =============================================================================

//  Públicas

// GET /api/v1/special-events/billboard?cinemaId=
router.get('/billboard', optionalAuth, specialEventsController.getBillboard);

// GET /api/v1/special-events/upcoming
router.get('/upcoming', optionalAuth, specialEventsController.getUpcoming);

// GET /api/v1/special-events
router.get('/', optionalAuth, specialEventsController.findAll);

// POST /api/v1/special-events
router.post(
    '/',
    verifySession,
    verifyPermission('CRUD:CREATE:SPECIAL_EVENTS'),
    imageUpload,
    specialEventsController.create,
);

//  Administrativas estáticas — ANTES de /:id y /admin/:id

// GET /api/v1/special-events/admin/showtimes?cinemaId=&eventId=&startDate=&endDate=&onlyFuture=
router.get(
    '/admin/showtimes',
    verifySession,
    verifyPermission('CRUD:READ:SPECIAL_EVENTS'),
    specialEventsController.getAdminShowtimes,
);

// GET /api/v1/special-events/admin
router.get(
    '/admin',
    verifySession,
    verifyPermission('CRUD:READ:SPECIAL_EVENTS'),
    specialEventsController.findAllAdmin,
);

// =============================================================================
//  RUTAS DINÁMICAS — con :id, siempre al final
// =============================================================================

// GET /api/v1/special-events/:id
router.get('/:id', optionalAuth, specialEventsController.findById);

// GET /api/v1/special-events/:id/showtimes?cinemaId=
router.get('/:id/showtimes', optionalAuth, specialEventsController.getPublicShowtimes);

// GET /api/v1/special-events/admin/:id
router.get(
    '/admin/:id',
    verifySession,
    verifyPermission('CRUD:READ:SPECIAL_EVENTS'),
    specialEventsController.findByIdAdmin,
);

// PATCH /api/v1/special-events/:id
router.patch(
    '/:id',
    verifySession,
    verifyPermission('CRUD:UPDATE:SPECIAL_EVENTS'),
    imageUpload,
    specialEventsController.update,
);

// DELETE /api/v1/special-events/:id
router.delete(
    '/:id',
    verifySession,
    verifyPermission('CRUD:DELETE:SPECIAL_EVENTS'),
    specialEventsController.remove,
);

export default router;
