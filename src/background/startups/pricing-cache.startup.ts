import { PricingCacheService } from '@services/pricing-cache.service.js';
import { Logger } from '@utils/logger.util.js';

export default async function () {
    try {
        await PricingCacheService.getActiveModifiers();
    } catch (error: any) {
        Logger.error('Failed to initialize PricingCacheService in startup', error as Error);
        throw error;
    }
}
