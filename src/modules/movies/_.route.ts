import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth } from '@middlewares/auth.middleware.js';

const router = Router();

/**
 * Endpoints públicos con auth opcional.
 * El optionalAuth permite que, cuando el usuario esté logueado,
 * la sesión quede disponible en req.session para futuras integraciones
 * con el motor de recomendaciones (RF-31, HU-APP-WEB-33).
 */
router.get('/', optionalAuth, moviesController.findAll);
router.get('/:id', optionalAuth, moviesController.findById);

export default router;
