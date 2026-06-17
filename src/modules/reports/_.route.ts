import { Router } from 'express';
import reportsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// ── Dashboard consolidado ─────────────────────────────────────────────────────
router.get(
    '/dashboard',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-DASHBOARD'),
    reportsController.getDashboard,
);

// ── Charts ────────────────────────────────────────────────────────────────────
router.get(
    '/:reportType/chart',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-CHARTS'),
    reportsController.getChart,
);

// ── Exportación ───────────────────────────────────────────────────────────────
router.get(
    '/:reportType/export',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-EXPORT'),
    reportsController.export,
);

// ── Reportes individuales ─────────────────────────────────────────────────────
router.get('/sales', verifySession, verifyPermission('CRUD:READ:REPORTS-SALES'), reportsController.getSales);
router.get('/movies', verifySession, verifyPermission('CRUD:READ:REPORTS-MOVIES'), reportsController.getMovies);
router.get('/events', verifySession, verifyPermission('CRUD:READ:REPORTS-EVENTS'), reportsController.getEvents);
router.get(
    '/inventory',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-INVENTORY'),
    reportsController.getInventory,
);
router.get('/cashier', verifySession, verifyPermission('CRUD:READ:REPORTS-CASHIER'), reportsController.getCashier);
router.get(
    '/showtimes',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-SHOWTIMES'),
    reportsController.getShowtimes,
);
router.get('/rentals', verifySession, verifyPermission('CRUD:READ:REPORTS-RENTALS'), reportsController.getRentals);

export default router;
