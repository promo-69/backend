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
				const parsed = JSON.parse(cached);
				// Reconstruir opTypesMap como Map para consumo en memoria
				const opTypesMap = parsed.opTypesMap
					? new Map<number, any>(Object.keys(parsed.opTypesMap).map((k) => [Number(k), parsed.opTypesMap[k]]))
					: parsed.opTypes
					? new Map<number, any>(parsed.opTypes.map((op: any) => [op.id, op]))
					: new Map<number, any>();

				return {
					modifiers: parsed.modifiers || [],
					opTypesMap,
					audienceCategories: parsed.audienceCategories || [],
					seatCategories: parsed.seatCategories || [],
				};
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
		
		// Construimos un Map para uso en memoria
		const opTypesMap = new Map<number, any>(opTypes.map((op: any) => [op.id, op]));

		// Datos serializables para almacenar en Redis
		const cachePayload = {
			modifiers: activeModifiers,
			opTypes: opTypes,
			audienceCategories,
			seatCategories,
		};

		try {
			await redis.set(this.CACHE_KEY, JSON.stringify(cachePayload));
		} catch (error) {
			Logger.error('[PricingCache] Error al guardar en Redis', error as Error);
		}

		return {
			modifiers: activeModifiers,
			opTypesMap,
			audienceCategories,
			seatCategories,
		};
	}
}
