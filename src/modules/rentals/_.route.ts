import { Router } from 'express';
import rentalsController from './_.controller.js';
import { verifySession, optionalAuth, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas o semi

// POST /rentals/requests - Formulario público de solicitud. optionalAuth: si hay token de cliente,
router.post('/requests', optionalAuth, rentalsController.create);

// GET /rentals/requests/me - El cliente consulta su propio historial. Requiere token de cliente.
router.get('/requests/me', verifySession, verifyPermission('VIEW:ACCESS:RENTALS-MY'), rentalsController.findMine);

//Backoffice

// GET /rentals/requests - Gerente lista las solicitudes de su cine (cinemaId del JWT).
router.get('/requests', verifySession, verifyPermission('CRUD:READ:RENTALS'), rentalsController.findAll);

// GET /rentals/requests/:id - Gerente consulta el detalle exhaustivo de una solicitud.
router.get('/requests/:id', verifySession, verifyPermission('CRUD:READ:RENTALS'), rentalsController.findById);

// PATCH /rentals/requests/:id/status - Gerente aprueba o rechaza la solicitud.
router.patch(
    '/requests/:id/status',
    verifySession,
    verifyPermission('CRUD:UPDATE:RENTALS'),
    rentalsController.updateStatus,
);

export default router;
