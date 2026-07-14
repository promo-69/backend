import { RealtimeProvider } from '@providers/realtime.provider.js';
import OrdersService from '@modules/orders/_.service.js';
import { Logger } from '@utils/logger.util.js';

export const processOrderPaymentTask = async (body: any, session: any) => {
    try {
        await OrdersService.executePaymentTransaction(body, session);
    } catch (error: any) {
        Logger.error(`Error procesando pago en background para usuario ${session.userId}:`, error);

        // Emitir evento de fallo al cliente
        try {
            const errorMessage = error.message || 'Error desconocido al procesar el pago.';
            RealtimeProvider.getInstance().emitToRoom(
                `usr_${session.userId}`,
                'payment_failed',
                {
                    message: errorMessage
                }
            );
        } catch (emitError: any) {
            Logger.error(`Fallo al notificar payment_failed al usuario ${session.userId}:`, emitError);
        }
    }
};
