import { Router } from 'express';
import ratesController from './_.controller.js';
import { verifySession, verifyRole } from '@middlewares/auth.middleware.js';

const router = Router();
const adminRoles = ['SUPER_ADMIN', 'CINEMA_MANAGER'];

router.get('/currencies', verifySession, ratesController.listCurrencies);
router.get('/currencies/:id', verifySession, ratesController.getCurrencyById);
router.post('/currencies', verifySession, verifyRole(adminRoles), ratesController.createCurrency);
router.put('/currencies/:id', verifySession, verifyRole(adminRoles), ratesController.updateCurrency);
router.delete('/currencies/:id', verifySession, verifyRole(adminRoles), ratesController.deleteCurrency);

router.get('/exchange-rates', verifySession, ratesController.listExchangeRates);
router.get('/exchange-rates/:id', verifySession, ratesController.getExchangeRateById);
router.post('/exchange-rates', verifySession, verifyRole(adminRoles), ratesController.createExchangeRate);
router.delete('/exchange-rates/:id', verifySession, verifyRole(adminRoles), ratesController.deleteExchangeRate);
router.get('/exchange-rates/currency/:currencyId/history', verifySession, ratesController.getExchangeRateHistoryByCurrency);

export default router;
