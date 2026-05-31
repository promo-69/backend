import { Router } from 'express';
import showtimesController from './_.controller.js';
import { verifySession, optionalAuth, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
// GET /showtimes/billboard
router.get('/billboard', optionalAuth, showtimesController.getBillboard);
// GET /showtimes
// Lista de funciones disponibles (futuras).
router.get('/', optionalAuth, showtimesController.findAll);
// GET /showtimes/:id
// Detalle de una función específica.
router.get('/:id', optionalAuth, showtimesController.findById);

// GET /showtimes/:id/seat-map
router.get('/:id/seat-map', optionalAuth, showtimesController.getSeatMap);

// Rutas protegidas (requieren sesión y permiso de backoffice)
router.post('/', verifySession, verifyPermission('CRUD:CREATE:SHOWTIMES'), showtimesController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:SHOWTIMES'), showtimesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:SHOWTIMES'), showtimesController.remove);

export default router;
