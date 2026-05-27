import { Router } from 'express';
import exchangeRatesController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();
const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

router.get('/', verifySession, exchangeRatesController.listExchangeRates);
router.get('/:id', verifySession, exchangeRatesController.getExchangeRateById);
router.post('/', verifySession, verifyRole(adminRoles), exchangeRatesController.createExchangeRate);
router.delete('/:id', verifySession, verifyRole(adminRoles), exchangeRatesController.deleteExchangeRate);
router.get('/currency/:currencyId/history', verifySession, exchangeRatesController.getExchangeRateHistoryByCurrency);

export default router;
