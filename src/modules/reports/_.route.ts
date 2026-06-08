import { Router } from 'express';
import reportsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// Todos los endpoints de reportes requieren sesión activa y el permiso correspondiente.
// El cinemaId se extrae del JWT — el empleado solo ve los datos de su sucursal.

// GET /reports/sales
router.get('/sales', verifySession, verifyPermission('CRUD:READ:REPORTS-SALES'), reportsController.getSales);

// GET /reports/movies
router.get('/movies', verifySession, verifyPermission('CRUD:READ:REPORTS-MOVIES'), reportsController.getMovies);

// GET /reports/inventory
router.get(
    '/inventory',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-INVENTORY'),
    reportsController.getInventory,
);

// GET /reports/cashier
// Cajero solo ve su propio turno (employeeId del JWT).
router.get('/cashier', verifySession, verifyPermission('CRUD:READ:REPORTS-CASHIER'), reportsController.getCashier);

// GET /reports/showtimes
router.get(
    '/showtimes',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-SHOWTIMES'),
    reportsController.getShowtimes,
);

// GET /reports/rentals
router.get('/rentals', verifySession, verifyPermission('CRUD:READ:REPORTS-RENTALS'), reportsController.getRentals);

// =============================================================
// RUTAS EXPLÍCITAS PARA SUPERADMIN (cinemaId en URL)
// =============================================================
router.get(
    '/cinemas/:cinemaId/sales',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-ALL'),
    reportsController.getSalesByCinema,
);
router.get(
    '/cinemas/:cinemaId/movies',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-ALL'),
    reportsController.getMoviesByCinema,
);
router.get(
    '/cinemas/:cinemaId/inventory',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-ALL'),
    reportsController.getInventoryByCinema,
);
router.get(
    '/cinemas/:cinemaId/showtimes',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-ALL'),
    reportsController.getShowtimesByCinema,
);
router.get(
    '/cinemas/:cinemaId/rentals',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-ALL'),
    reportsController.getRentalsByCinema,
);
router.get(
    '/cinemas/:cinemaId/cashier/:employeeId',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-ALL'),
    reportsController.getCashierByCinema,
);

// GET /reports/:reportType/export?format=json|csv|pdf
// IMPORTANTE: esta ruta va DESPUÉS de las específicas para que Express no
// interprete "sales", "movies", etc. como :reportType.
router.get(
    '/:reportType/export',
    verifySession,
    verifyPermission('CRUD:READ:REPORTS-EXPORT'),
    reportsController.export,
);

export default router;
