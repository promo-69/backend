import { Database } from '@database/index.js';
import { CacheDatabaseProvider } from '@providers/cache-database.provider.js';
import { Logger } from '@utils/logger.util.js';

export class PricingCacheService {
	private static readonly CACHE_KEY = 'cache:price_modifiers';

	/**
	 * Invalida la caché global de modificadores de precio.
	 */
	static async invalidateCache() {
		try {
			const redis = CacheDatabaseProvider.getInstance().client;
			await redis.del(this.CACHE_KEY);
			Logger.info('[PricingCache] Caché de modificadores invalidada');
		} catch (error) {
			Logger.error('[PricingCache] Error al invalidar la caché', error as Error);
		}
	}

	/**
	 * Obtiene los modificadores activos y el diccionario de operation_types desde Redis o Base de Datos.
	 */
	static async getActiveModifiers() {
		const redis = CacheDatabaseProvider.getInstance().client;
		
		try {
			const cached = await redis.get(this.CACHE_KEY);
			if (cached) {
				return JSON.parse(cached);
			}
		} catch (error) {
			Logger.warn(`[PricingCache] Fallo al leer de Redis, cayendo a DB: ${(error as Error).message}`);
		}

		Logger.info('[PricingCache] Cargando modificadores en bloque desde la base de datos...');
		
		// Bulk load from DB
		const modifiersRepo = Database.repository('main', 'price-modifiers') as any;
		const opTypesRepo = Database.repository('main', 'operation-types') as any;
		const audienceCatRepo = Database.repository('main', 'audience-categories') as any;
		const seatCatRepo = Database.repository('main', 'seat-categories') as any;

		const [modifiersList, opTypesList, audienceList, seatList] = await Promise.all([
			modifiersRepo.getAll({ count: false }, { deleted_at: null }),
			opTypesRepo.getAll({ count: false }, { deleted_at: null }),
			audienceCatRepo.getAll({ count: false, attributes: ['id', 'description'] }, { deleted_at: null }),
			seatCatRepo.getAll({ count: false, attributes: ['id', 'description'] }, { deleted_at: null })
		]);

		const activeModifiers = Array.isArray(modifiersList) ? modifiersList : modifiersList.rows || [];
		const opTypes = Array.isArray(opTypesList) ? opTypesList : opTypesList.rows || [];
		const audienceCategories = Array.isArray(audienceList) ? audienceList : audienceList.rows || [];
		const seatCategories = Array.isArray(seatList) ? seatList : seatList.rows || [];
		
		// Pre-computamos el mapa de opTypes para acceso O(1)
		const opTypesMap: Record<number, any> = {};
		for (const op of opTypes) {
			opTypesMap[op.id] = op;
		}

		const data = {
			modifiers: activeModifiers,
			opTypesMap,
			audienceCategories,
			seatCategories
		};

		try {
			await redis.set(this.CACHE_KEY, JSON.stringify(data));
		} catch (error) {
			Logger.error('[PricingCache] Error al guardar en Redis', error as Error);
		}

		return data;
	}
}
