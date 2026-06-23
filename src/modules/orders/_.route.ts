import { Router } from 'express';
import OrdersController from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

router.get('/session', verifySession, OrdersController.getShoppingSessionState);
router.get('/session/details', verifySession, OrdersController.getShoppingSessionDetails);
router.delete('/session', verifySession, OrdersController.cancelShoppingSession);
router.post('/quote', verifySession, OrdersController.createQuote);
router.post('/checkout', verifySession, OrdersController.checkout);
router.post('/payments', verifySession, OrdersController.processPayment);
router.post('/billing', verifySession, OrdersController.processBilling);
router.get('/:id', verifySession, OrdersController.getOrderById);
router.get(
	'/qr/:qrCode/concessions',
	verifySession,
	verifyPermission('CRUD:READ:ORDER-DETAILS'),
	OrdersController.getConcessionsByQr,
);
router.get(
	'/qr/:qrCode/tickets',
	verifySession,
	verifyPermission('CRUD:READ:ORDER-DETAILS'),
	OrdersController.getTicketsByQr,
);
router.post(
	'/validate-qr/:qrCode',
	verifySession,
	verifyPermission('CRUD:UPDATE:ORDER-DETAILS'),
	OrdersController.validateQr,
);

export default router;
