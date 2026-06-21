import { Router } from 'express';
import paymentsController from './_.controller.js';
import { verifyPermission, verifySession } from '@middlewares/auth.middleware.js';

const router = Router();

// Endpoint público para obtener las opciones de pago (métodos, monedas y cuentas bancarias)
router.get('/options', paymentsController.getPaymentOptions);

// Endpoints para gestión de cuentas bancarias (protegidos por permisos)
router.get('/bank-accounts', verifySession, verifyPermission('CRUD:READ:PAYMENTS_MODULE'), paymentsController.getBankAccounts);
router.post('/bank-accounts', verifySession, verifyPermission('CRUD:CREATE:PAYMENTS_MODULE'), paymentsController.createBankAccount);
router.patch('/bank-accounts/:id', verifySession, verifyPermission('CRUD:UPDATE:PAYMENTS_MODULE'), paymentsController.updateBankAccount);
router.delete('/bank-accounts/:id', verifySession, verifyPermission('CRUD:DELETE:PAYMENTS_MODULE'), paymentsController.deleteBankAccount);

export default router;
