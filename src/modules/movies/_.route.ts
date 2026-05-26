import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth, verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();
const imageUpload = uploadFields(
	[
		{ name: 'banner', maxCount: 1 },
		{ name: 'poster', maxCount: 1 },
	],
	{ maxSizeMB: 25 },
);

router.get('/', optionalAuth, moviesController.findAll);
router.get('/showtimes', optionalAuth, moviesController.findWithShowtimes);
router.get('/:id', optionalAuth, moviesController.findById);
router.post('/', verifySession, verifyPermission('CRUD:UPDATE:MOVIES'), imageUpload, moviesController.create);
router.patch('/:id', verifySession, verifyPermission('CRUD:UPDATE:MOVIES'), imageUpload, moviesController.update);
router.delete('/:id', verifySession, verifyPermission('CRUD:DELETE:MOVIES'), moviesController.remove);

export default router;
