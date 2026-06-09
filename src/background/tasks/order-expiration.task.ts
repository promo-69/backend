import shoppingSessionService from '@services/shopping-session.service.js';

/**
 * Tarea encargada de procesar la expiración de una orden pendiente (cotización de compras).
 */
export async function orderExpirationTask(orderId: number, userId: number): Promise<void> {
	await shoppingSessionService.expirePendingOrder(orderId, userId);
}
