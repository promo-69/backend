import { Router } from 'express';
import reportsController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// Rutas para empleado (cinemaId del JWT)
router.get('/sales', verifySession, verifyPermission('CRUD:READ:REPORTS-SALES'), reportsController.getSales);
router.get('/movies', verifySession, verifyPermission('CRUD:READ:REPORTS-MOVIES'), reportsController.getMovies);
router.get('/events', verifySession, verifyPermission('CRUD:READ:REPORTS-EVENTS'), reportsController.getEvents);
router.get('/inventory', verifySession, verifyPermission('CRUD:READ:REPORTS-INVENTORY'), reportsController.getInventory);
router.get('/cashier', verifySession, verifyPermission('CRUD:READ:REPORTS-CASHIER'), reportsController.getCashier);
router.get('/showtimes', verifySession, verifyPermission('CRUD:READ:REPORTS-SHOWTIMES'), reportsController.getShowtimes);
router.get('/rentals', verifySession, verifyPermission('CRUD:READ:REPORTS-RENTALS'), reportsController.getRentals);

// Rutas para superadmin (cinemaId en URL)
router.get('/cinemas/:cinemaId/sales', verifySession, verifyPermission('CRUD:READ:REPORTS-ALL'), reportsController.getSalesByCinema);
router.get('/cinemas/:cinemaId/movies', verifySession, verifyPermission('CRUD:READ:REPORTS-ALL'), reportsController.getMoviesByCinema);
router.get('/cinemas/:cinemaId/events', verifySession, verifyPermission('CRUD:READ:REPORTS-ALL'), reportsController.getEventsByCinema);
router.get('/cinemas/:cinemaId/inventory', verifySession, verifyPermission('CRUD:READ:REPORTS-ALL'), reportsController.getInventoryByCinema);
router.get('/cinemas/:cinemaId/showtimes', verifySession, verifyPermission('CRUD:READ:REPORTS-ALL'), reportsController.getShowtimesByCinema);
router.get('/cinemas/:cinemaId/rentals', verifySession, verifyPermission('CRUD:READ:REPORTS-ALL'), reportsController.getRentalsByCinema);
router.get('/cinemas/:cinemaId/cashier/:employeeId', verifySession, verifyPermission('CRUD:READ:REPORTS-ALL'), reportsController.getCashierByCinema);

// Exportación (última para no interferir con las rutas anteriores)
router.get('/:reportType/export', verifySession, verifyPermission('CRUD:READ:REPORTS-EXPORT'), reportsController.export);

export default router;
