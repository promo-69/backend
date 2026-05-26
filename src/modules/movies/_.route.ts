import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth, verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();

const movieUpload = uploadFields(
    [
        { name: 'poster', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
    ],
    { maxSizeMB: 10 },
);

// Públicos
router.get('/', optionalAuth, moviesController.findAll);
router.get('/cartelera', optionalAuth, moviesController.findInCartelera);
router.get('/:id', optionalAuth, moviesController.findById);

// Admin (protegidos con permisos)
router.post('/', verifySession, verifyPermission('CRUD:CREATE:MOVIES'), movieUpload, moviesController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:MOVIES'), movieUpload, moviesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:MOVIES'), moviesController.remove);

export default router;
