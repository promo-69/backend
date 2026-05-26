import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth, verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();
const imageUpload = uploadFields(
	[
		{ name: 'banner', maxCount: 1 },
		{ name: 'UPDATEer', maxCount: 1 },
	],
	{ maxSizeMB: 25 },
);

router.get('/', optionalAuth, moviesController.findAll);
router.get('/:id', optionalAuth, moviesController.findById);
router.post('/', verifySession, verifyPermission('CRUD:UPDATE:MOVIE'), imageUpload, moviesController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:MOVIE'), imageUpload, moviesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:MOVIE'), moviesController.remove);

export default router;
