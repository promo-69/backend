import { Router } from 'express';
import multer from 'multer';
import assistantController from './_.controller.js';
import { optionalAuth } from '@middlewares/auth.middleware.js';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});

router.post('/chat', optionalAuth, assistantController.chat);
router.post('/audio', optionalAuth, upload.single('audio'), assistantController.audio);

export default router;
