import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth, verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import { MiddlewareHandler } from '@rules/api.type.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];
const middlewares = [verifySession, verifyRole(adminRoles)];

// Públicos (HU-APP-WEB-06, HU-APP-WEB-07)
router.get('/', optionalAuth, moviesController.findAll);
router.get('/cartelera', optionalAuth, moviesController.findInCartelera);
router.get('/:id', optionalAuth, moviesController.findById);

// Admin (HU-OPERATIVA-12, HU-OPERATIVA-13)
// router.post('/', middlewares, verifyRole(adminRoles), moviesController.create);
router.post('/', ...middlewares, moviesController.create);
// router.put('/:id', middlewares, verifyRole(adminRoles), moviesController.update);
router.put('/:id', ...middlewares, moviesController.update);
// router.delete('/:id', middlewares, verifyRole(['SUPER_ADMIN']), moviesController.remove);
router.delete('/:id', ...middlewares, moviesController.remove);

export default router;
