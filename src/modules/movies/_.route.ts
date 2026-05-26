import { Router } from 'express';
import moviesController from './_.controller.js';
import { optionalAuth, verifySession, verifyRole } from '@middlewares/auth.middleware.js';
import { uploadFields } from '@middlewares/upload.middleware.js';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];
const imageUpload = uploadFields(
	[
		{ name: 'banner', maxCount: 1 },
		{ name: 'poster', maxCount: 1 },
	],
	{ maxSizeMB: 25 },
);

router.get('/', optionalAuth, moviesController.findAll);
router.get('/:id', optionalAuth, moviesController.findById);
router.post('/', verifySession, verifyRole(adminRoles), imageUpload, moviesController.create);
router.patch('/:id', verifySession, verifyRole(adminRoles), imageUpload, moviesController.update);
router.delete('/:id', verifySession, verifyRole(adminRoles), moviesController.remove);

export default router;
