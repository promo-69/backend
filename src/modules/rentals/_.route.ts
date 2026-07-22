import { Router } from 'express';
import rentalsController from './_.controller.js';
import { verifySession, optionalAuthStrict, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// ── Rutas públicas / semi-públicas ────────────────────────────────────────────

// POST /rentals/requests (pública o con token)
router.post('/requests', optionalAuthStrict, rentalsController.create);

// GET /rentals/requests/me (solo cliente autenticado, sin permiso adicional)
router.get('/requests/me', verifySession, rentalsController.findMine);

// PATCH /rentals/requests/:id/payment (cliente o empleado)
router.patch('/requests/:id/payment', verifySession, rentalsController.confirmPayment);

// ── Taquilla (POS): cobro de solicitudes de alquiler aprobadas ────────────────

// GET /rentals/pos/payable — lista solicitudes "Pendiente de Pago" del cine del
// cajero (o todas, si es superadmin), buscables por cédula/nombre/correo/ref.
router.get('/pos/payable', verifySession, verifyPermission('CRUD:UPDATE:RENTALS'), rentalsController.findPayable);

// POST /rentals/pos/:id/pay — registra el pago en taquilla y marca la solicitud
// como pagada (confirma la reserva de sala).
router.post('/pos/:id/pay', verifySession, verifyPermission('CRUD:UPDATE:RENTALS'), rentalsController.payFromPOS);

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
