import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { RealtimeProvider } from '@providers/realtime.provider.js';
import { Logger } from '@utils/logger.util.js';

export const posTimeoutTask = async (ticketId: string, userId: number, orderId: number) => {
    const redis = CacheDatabaseProvider.getInstance().client;
    const ticketKey = `pos_ticket:${ticketId}`;
    
    // Validar si el ticket todavía existe (el timeout se cumplió y el POS nunca respondió)
    const exists = await redis.exists(ticketKey);
    
    if (exists) {
        // Borrar el ticket para que no se procesen respuestas tardías
        await redis.del(ticketKey);
        
        Logger.warn(`Timeout de POS expirado para el ticket ${ticketId}.`);
        
        // Notificar al frontend sobre la falla
        try {
            RealtimeProvider.getInstance().emitToRoom(
                `usr_${userId}`,
                'payment_failed',
                {
                    orderId,
                    message: 'Tiempo de espera agotado al comunicar con el Punto de Venta. Intente de nuevo.'
                }
            );
        } catch (error: any) {
            Logger.error(`Error emitiendo evento payment_failed al usuario ${userId}:`, error);
        }
    }
};
