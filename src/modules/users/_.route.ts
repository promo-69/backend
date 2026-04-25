import { Router } from 'express';
import usersController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();

// Middleware de administrador (Asumiendo 'ADM' o 'ADMINISTRATOR' como código de rol, se puede ajustar)
const adminMiddleware = [verifySession, verifyRole(['ADM', 'ADMIN', 'ADMINISTRATOR', 'GERENTE'])];

// Tarea 1: Creación Administrativa de Cuentas
router.post('/', ...adminMiddleware, usersController.createAccount);

// Tarea 2: Suspensión/Bloqueo o Reactivación de Acceso
router.patch('/:id/status', ...adminMiddleware, usersController.changeStatus);

export default router;
