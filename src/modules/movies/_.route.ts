import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth, verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

// Públicos (HU-APP-WEB-06, HU-APP-WEB-07)
router.get('/', optionalAuth, moviesController.findAll);
router.get('/:id', optionalAuth, moviesController.findById);

// Admin (HU-OPERATIVA-12, HU-OPERATIVA-13)
// router.post('/', verifySession, verifyRole(adminRoles), moviesController.create);
router.post('/', verifySession, moviesController.create);
// router.put('/:id', verifySession, verifyRole(adminRoles), moviesController.update);
router.put('/:id', verifySession, moviesController.update);
// router.delete('/:id', verifySession, verifyRole(['SUPER_ADMIN']), moviesController.remove);
router.delete('/:id', verifySession, moviesController.remove);

export default router;
