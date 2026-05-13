import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth, verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];
const middlewares = [verifySession, verifyRole(adminRoles)];
const movieUpload = uploadFields(
    [
        { name: 'poster', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
    ],
    { maxSizeMB: 10 },
);

// Públicos (HU-APP-WEB-06, HU-APP-WEB-07)
router.get('/', optionalAuth, moviesController.findAll);
router.get('/cartelera', optionalAuth, moviesController.findInCartelera);
router.get('/:id', optionalAuth, moviesController.findById);

// Admin (HU-OPERATIVA-12, HU-OPERATIVA-13)
router.post('/', ...middlewares, movieUpload, moviesController.create);
router.put('/:id', ...middlewares, movieUpload, moviesController.update);
router.delete('/:id', ...middlewares, moviesController.remove);

export default router;
