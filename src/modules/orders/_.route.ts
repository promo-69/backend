import { Router } from 'express';
import { OrdersController } from './_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();
const controller = new OrdersController();

router.post('/quote', verifySession, controller.createQuote);
router.post('/checkout', verifySession, controller.checkout);
router.post('/payments', verifySession, controller.processPayment);
router.get('/:id', controller.getOrderById);
router.get(
	'/qr/:qrCode/concessions',
	verifySession,
	verifyPermission('CRUD:READ:ORDER-DETAILS'),
	controller.getConcessionsByQr,
);
router.get(
	'/qr/:qrCode/tickets',
	verifySession,
	verifyPermission('CRUD:READ:ORDER-DETAILS'),
	controller.getTicketsByQr,
);
router.post(
	'/validate-qr/:qrCode',
	verifySession,
	verifyPermission('CRUD:UPDATE:ORDER-DETAILS'),
	controller.validateQr,
);

export default router;
