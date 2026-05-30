import { Router } from 'express';
import showtimesController from './_.controller.js';
import { verifySession, optionalAuth, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// =============================================================================
// RUTAS PÚBLICAS — accesibles sin autenticación
// optionalAuth: enriquece req.session si hay token válido, pero no bloquea si no.
// =============================================================================

/**
 * GET /showtimes/billboard
 * Cartelera global: películas en cartelera con sus funciones futuras agrupadas.
 */
router.get('/billboard', optionalAuth, showtimesController.getBillboard);

/**
 * GET /showtimes
 * Lista de funciones disponibles (futuras).
 * Soporta filtro por fecha: ?date=2026-06-15  → solo funciones de ese día
 */
router.get('/', optionalAuth, showtimesController.findAll);

/**
 * GET /showtimes/:id
 * Detalle de una función específica.
 */
router.get('/:id', optionalAuth, showtimesController.findById);

// =============================================================================
// RUTAS PRIVADAS — requieren sesión y permiso de backoffice
// =============================================================================

router.post('/', verifySession, verifyPermission('CRUD:CREATE:SHOWTIMES'), showtimesController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:SHOWTIMES'), showtimesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:SHOWTIMES'), showtimesController.remove);

export default router;
