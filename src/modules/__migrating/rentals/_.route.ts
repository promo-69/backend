import { Router } from 'express';
import rentalsController from './_.controller.js';
import { verifySession, optionalAuth, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// ── Rutas públicas / semi-públicas ────────────────────────────────────────────

// POST /rentals/requests (pública o con token)
router.post('/requests', optionalAuth, rentalsController.create);

// GET /rentals/requests/me (solo cliente autenticado, sin permiso adicional)
router.get('/requests/me', verifySession, rentalsController.findMine);

// PATCH /rentals/requests/:id/payment (cliente o empleado)
router.patch('/requests/:id/payment', verifySession, rentalsController.confirmPayment);

// ── Rutas privadas (backoffice) ───────────────────────────────────────────────

// GET /rentals/requests (gerente de sucursal)
router.get('/requests', verifySession, verifyPermission('CRUD:READ:RENTALS'), rentalsController.findAll);

// GET /rentals/admin/requests (superadmin / backoffice global)
router.get(
    '/admin/requests',
    verifySession,
    verifyPermission('CRUD:READ:RENTALS_GLOBAL'),
    rentalsController.findAllAdmin,
);

// GET /rentals/requests/:id (detalle para gerente)
router.get('/requests/:id', verifySession, verifyPermission('CRUD:READ:RENTALS'), rentalsController.findById);

// PATCH /rentals/requests/:id/status (aprobar/rechazar)
router.patch(
    '/requests/:id/status',
    verifySession,
    verifyPermission('CRUD:UPDATE:RENTALS'),
    rentalsController.updateStatus,
);

export default router;
