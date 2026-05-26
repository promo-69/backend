import { Router } from 'express';
import cinemaCombosController from './combos.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router({ mergeParams: true });
const imageUpload = uploadFields([{ name: 'image', maxCount: 1 }], {
    maxSizeMB: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

router.get('/', verifySession, verifyPermission('CRUD:READ:CINEMAS-COMBOS'), cinemaCombosController.findAll);
router.post(
    '/',
    verifySession,
    verifyPermission('CRUD:CREATE:CINEMAS-COMBOS'),
    imageUpload,
    cinemaCombosController.create,
);

export default router;
