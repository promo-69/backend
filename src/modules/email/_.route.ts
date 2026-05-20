import { Router } from 'express';
import emailController from './_.controller.js';

const router = Router();

// Endpoint de prueba (GET /api/v1/email/test/:email)
router.get('/test/:email', emailController.sendTestEmail);

export default router;
