import { RealtimeProvider } from '@providers/realtime.provider.js';
import { QueueProvider } from '@providers/queue.provider.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { PAYMENT_METHOD } from '@constants/magic-vars.constant.js';
import { Logger } from '@utils/logger.util.js';
import { Socket } from 'socket.io';

import { AppConfig } from '@config/app.config.js';

export class PosSocketService {
    public static initialize() {
        const realtime = RealtimeProvider.getInstance();

        realtime.registerEventHandler('pos:join', async (socket: Socket, data: any) => {
            const posApiKey = data?.posApiKey;
            const expectedApiKey = AppConfig.load().security.posApiKey;

            // Permite unirse si tiene la API Key de POS
            if (posApiKey === expectedApiKey) {
                socket.join('pos_devices');
                Logger.info(`[WS] Dispositivo POS conectado a la sala pos_devices (Socket: ${socket.id})`);
            } else {
                Logger.warn(`[WS] Intento no autorizado de unirse a pos_devices (Socket: ${socket.id})`);
            }
        });

        realtime.registerEventHandler('pos:payment_result', async (socket: Socket, data: any) => {
            try {
                const { ticketId, amount, success, reference_number, message } = data;
                if (!ticketId) {
                    Logger.warn(`Mensaje POS recibido sin ticketId de ${socket.id}`);
                    return;
                }

                const redis = CacheDatabaseProvider.getInstance().client;
                const ticketKey = `pos_ticket:${ticketId}`;
                const ticketDataStr = await redis.get(ticketKey);

                if (!ticketDataStr) {
                    Logger.warn(`Respuesta POS descartada: Ticket ${ticketId} no existe o expiró.`);
                    return;
                }

                const ticketData = JSON.parse(ticketDataStr);
                const { session, orderId, body } = ticketData;

                // Borrar el ticket para cancelar el timeout
                await redis.del(ticketKey);

                if (success === true || success === 'true') {
                    // Actualizar el body con la referencia que entregó el POS
                    let paymentsInput = Array.isArray(body) ? body : [body];
                    const posPayment = paymentsInput.find(p => p.payment_method === PAYMENT_METHOD.POS);

                    if (posPayment) {
                        posPayment.reference_number = reference_number || `POS-${ticketId}`;
					    posPayment.amount = amount;
                        posPayment.bypass = true;
                    }

                    // Encolar para procesamiento final
                    QueueProvider.getInstance().add(
                        'order-payment-queue',
                        'process-order-payment',
                        { body, session }
                    ).catch((err: any) => Logger.error('Error in pos-socket order-payment-queue', err));

                } else {
                    // Notificar al usuario que falló el pago en POS
                    const errorMessage = message || 'Transacción denegada o fallida en el Punto de Venta.';
                    RealtimeProvider.getInstance().emitToRoom(
                        `usr_${session.userId}`,
                        'payment_failed',
                        {
                            orderId,
                            message: errorMessage
                        }
                    );
                }

            } catch (error: any) {
                Logger.error(`Error procesando respuesta de POS:`, error);
            }
        });
    }
}
