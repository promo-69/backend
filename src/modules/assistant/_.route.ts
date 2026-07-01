import { Router } from 'express';
import assistantController from './_.controller.js';
import { optionalAuth } from '@middlewares/auth.middleware.js';

const router = Router();

router.post('/chat', optionalAuth, assistantController.chat);

export default router;
