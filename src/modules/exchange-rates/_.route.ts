import { Router } from 'express';
import exchangeRatesController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifySession, verifyPermission('CRUD:READ:EXCHANGE-RATES'), exchangeRatesController.listExchangeRates);
router.get(
	'/:id',
	verifySession,
	verifyPermission('CRUD:READ:EXCHANGE-RATES'),
	exchangeRatesController.getExchangeRateById,
);
router.post(
	'/',
	verifySession,
	verifyPermission('CRUD:CREATE:EXCHANGE-RATES'),
	exchangeRatesController.createExchangeRate,
);
router.delete(
	'/:id',
	verifySession,
	verifyPermission('CRUD:DELETE:EXCHANGE-RATES'),
	exchangeRatesController.deleteExchangeRate,
);
router.get(
	'/currency/:currencyId/history',
	verifySession,
	verifyPermission('CRUD:READ:EXCHANGE-RATES'),
	exchangeRatesController.getExchangeRateHistoryByCurrency,
);

export default router;
