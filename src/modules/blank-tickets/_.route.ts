import { Router } from 'express';
import blankTicketsController from './_.controller.js';
import { verifySession } from '@middlewares/auth.middleware.js';

const router = Router();

// Validación del vale por parte del cajero (Fase B). La conversión a ticket real
router.get('/:code', verifySession, blankTicketsController.validate);

export default router;
