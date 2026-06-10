import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { concessionImagesService } from '@services/concession-images.service.js';
import { imageStorageService } from '@services/image-storage.service.js';
import { PricingService } from '@services/pricing.service.js';
import { PricingCacheService } from '@services/pricing-cache.service.js';
import shoppingSessionService from '@services/shopping-session.service.js';
import { Logger } from '@utils/logger.util.js';
import { Transaction } from 'sequelize';

export class ComboManagementService {
	private get _combos() {
		return Database.repository('main', 'combos') as any;
	}
	private get _comboProducts() {
		return Database.repository('main', 'combo-products') as any;
	}

	async createCombo(body: any, rawFiles?: any, cinemaId?: number) {
		const { name, sku, description } = body;

		const price = Number(body.price);
		const currencyId = Number(body.currencyId);
		const earnedLoyaltyPoints =
			body.earnedLoyaltyPoints !== undefined ? Number(body.earnedLoyaltyPoints) : undefined;
		const products: Array<{ productId: number; quantity: number }> =
			typeof body.products === 'string' ? JSON.parse(body.products) : body.products;

		if (!name || !sku || !description) throw new ValidationError('Faltan datos obligatorios del combo');
		if (isNaN(price) || price <= 0) throw new ValidationError('El precio debe ser un número positivo');
		if (!Array.isArray(products) || products.length === 0)
			throw new ValidationError('El combo debe tener al menos un producto');

		const existing = await this._combos.getOne({ sku });
		if (existing) throw new ConflictError('Ya existe un combo con ese SKU', 'COMBO_SKU_DUPLICATE');

		const imageFile = concessionImagesService.extractImage(rawFiles);
		const { imageUrl, imageFileId } = await concessionImagesService.uploadComboImage(imageFile);

		try {
			const created = await this._combos.transaction(async (transaction: Transaction) => {
				const combo = await this._combos.create(
					{
						name,
						sku,
						description,
						currency: currencyId,
						price,
						earned_loyalty_points: earnedLoyaltyPoints ?? null,
						image_url: imageUrl ?? null,
						cinema: cinemaId,
					},
					{ transaction },
				);

				const comboProductRecords = products.map(({ productId, quantity }) => ({
					combo: combo.id,
					product: productId,
					quantity,
				}));
				await this._comboProducts.bulkCreate(comboProductRecords, { transaction });

				return combo;
			});

			return this._combos.getFull(created.id);
		} catch (error) {
			await concessionImagesService.rollbackUploadedImages([imageFileId]);
			throw error;
		}
	}

	async findAllCombos(filters?: any, userId?: number) {
		const options: any = {
			count: true,
			...filters,
		};
		if (filters?.cinemaId) options.where = { cinema: filters.cinemaId };

		const rawCombos = await this._combos.getAll(options);
		let comboList = Array.isArray(rawCombos) ? rawCombos : rawCombos.rows || [];

		let activeQuote = null;
		let cacheData: any = null;

		if (userId) activeQuote = await shoppingSessionService.getActiveQuote(userId);

		if (activeQuote) cacheData = await PricingCacheService.getActiveModifiers();
		else cacheData = await PricingCacheService.getActiveModifiers();

		const allCurrencies = await (Database.repository('main', 'currencies') as any).getAll({ count: false });
		const currencyMap = new Map<number, string>(allCurrencies.map((c: any) => [c.id, c.description]));

		const enrichedList = comboList.map((c: any) => {
			const comboClone = { ...c };

			if (!cacheData) return comboClone;

			const sessionDate = activeQuote ? new Date(activeQuote.created_at) : new Date();
			const currentDate = sessionDate.toISOString().split('T')[0];
			const currentTime = sessionDate.toTimeString().split(' ')[0];
			const currentDay = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay();

			const timeContext = { currentDate, currentTime, currentDay };

			const context = {
				modifier_scope: 2, // Confitería
				cinemaId: activeQuote ? activeQuote.cinema : c.cinema || filters?.cinemaId || null,
				line_type: null,
				product_category: null,
				product: null,
				combo: c.id,
			};

			const basePricing = PricingService.calculateFinalPrice(
				c.price,
				context,
				c.currency || 1,
				cacheData.modifiers,
				cacheData.opTypesMap,
				timeContext,
			);

			const itemCurr = c.currency || 1;
			const pricingObj: any = {
				currency: itemCurr,
				currency_description: currencyMap.get(itemCurr) || 'Desconocido',
				base_price: c.price,
				final_price: basePricing.finalPrice,
				applied_modifiers: basePricing.appliedModifiers,
			};

			if (activeQuote && activeQuote.exchange_rates) {
				const rateObj = activeQuote.exchange_rates[itemCurr] || { rate: 1 };
				const exRate = Number(rateObj.rate);
				pricingObj.base_currency_equivalent = {
					currency: activeQuote.system_base_currency,
					currency_description: currencyMap.get(activeQuote.system_base_currency) || 'Desconocido',
					exchange_rate: exRate,
					base_price: c.price * exRate,
					final_price: basePricing.finalPrice * exRate,
					applied_modifiers: basePricing.appliedModifiers.map((mod: any) => ({
						...mod,
						applied_amount: mod.applied_amount * exRate,
					})),
				};
			}

			comboClone.pricing = pricingObj;

			delete comboClone.price;
			delete comboClone.currency;

			return comboClone;
		});

		if (!Array.isArray(rawCombos))
			return {
				...rawCombos,
				rows: enrichedList,
			};

        const enrichedList = comboList.map((c: any) => {
            const comboClone = { ...c };
            
            if (!activeQuote || !cacheData) {
                return comboClone;
            }

            const sessionDate = new Date(activeQuote.created_at || Date.now());
            const currentDate = sessionDate.toISOString().split('T')[0];
            const currentTime = sessionDate.toTimeString().split(' ')[0];
            const currentDay = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay();

            const timeContext = { currentDate, currentTime, currentDay };
            
            const context = {
                modifier_scope: 2, // Confitería
                cinemaId: activeQuote.cinema,
                line_type: null,
                product_category: null,
                product: null,
                combo: c.id
            };

            const basePricing = PricingService.calculateFinalPrice(
                c.price,
                context,
                cacheData.modifiers,
                cacheData.opTypesMap,
                activeQuote.exchange_rates,
                timeContext
            );

            comboClone.pricing = {
                base_price: c.price,
                final_price: basePricing.finalPrice,
                applied_modifiers: basePricing.appliedModifiers
            };
            
            comboClone.price = basePricing.finalPrice;

            return comboClone;
        });

        if (!Array.isArray(rawCombos)) {
            return {
                ...rawCombos,
                rows: enrichedList
            };
        }
        return enrichedList;
    }
}

export default new ComboManagementService();
