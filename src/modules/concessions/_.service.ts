import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { concessionImagesService } from '@services/concession-images.service.js';
import { imageStorageService } from '@services/image-storage.service.js';
import { PricingService } from '@services/pricing.service.js';
import { PricingCacheService } from '@services/pricing-cache.service.js';
import shoppingSessionService from '@services/shopping-session.service.js';
import { Logger } from '@utils/logger.util.js';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateProductBody {
	name: string;
	sku: string;
	productCategory: number | string;
	currencyId: number | string;
	price: number | string;
	earnedLoyaltyPoints?: number | string;
}

interface CreateComboBody {
	name: string;
	sku: string;
	description: string;
	currencyId: number | string;
	price: number | string;
	earnedLoyaltyPoints?: number | string;
	products: Array<{ productId: number; quantity: number }> | string;
}

interface UpdateProductBody {
	name?: string;
	price?: number | string;
	currencyId?: number | string;
	earnedLoyaltyPoints?: number | string;
}

type RawFiles = Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;

export class ConcessionsService extends BaseService {
	constructor() {
		super();
	}

	private get _products() {
		return Database.repository('main', 'products') as any;
	}
	private get _combos() {
		return Database.repository('main', 'combos') as any;
	}
	private get _comboProducts() {
		return Database.repository('main', 'combo-products') as any;
	}

	// ==================== PRODUCTS ====================

	async createProduct(body: CreateProductBody, rawFiles?: RawFiles) {
		const { name, sku } = body;

		const price = Number(body.price);
		const productCategory = Number(body.productCategory);
		const currencyId = Number(body.currencyId);
		const earnedLoyaltyPoints =
			body.earnedLoyaltyPoints !== undefined ? Number(body.earnedLoyaltyPoints) : undefined;

		this.validateRequired({ name, sku, productCategory, currencyId, price } as any, [
			'name',
			'sku',
			'productCategory',
			'currencyId',
			'price',
		]);

		if (isNaN(price) || price <= 0) throw new ValidationError('El precio debe ser un número positivo', ['price']);

		const existing = await this._products.getOne({ sku });
		if (existing) throw new ConflictError('Ya existe un producto con ese SKU', 'PRODUCT_SKU_DUPLICATE');

		const imageFile = concessionImagesService.extractImage(rawFiles);
		const { imageUrl, imageFileId } = await concessionImagesService.uploadProductImage(imageFile);

		try {
			const created = await this._products.create({
				name,
				sku,
				product_category: productCategory,
				currency: currencyId,
				price,
				earned_loyalty_points: earnedLoyaltyPoints ?? null,
				image_url: imageUrl ?? null,
			});

			return this._products.getFull(created.id);
		} catch (error) {
			await concessionImagesService.rollbackUploadedImages([imageFileId]);
			throw error;
		}
	}

	async updateProduct(id: number, body: UpdateProductBody, rawFiles?: RawFiles) {
		return this._products.transaction(async (transaction: Transaction) => {
			const product = await this._products.getById(id, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!product) throw new NotFoundError('Producto no encontrado');

			const previousImageUrl: string | null = product.image_url ?? null;

			const safeBody = body ?? {};
			const updateData: Record<string, any> = {};

			if (safeBody.name !== undefined) updateData.name = safeBody.name;

			if (safeBody.price !== undefined) {
				const price = Number(safeBody.price);
				if (isNaN(price) || price <= 0)
					throw new ValidationError('El precio debe ser un número positivo', ['price']);
				updateData.price = price;
			}

			if (safeBody.currencyId !== undefined) updateData.currency = Number(safeBody.currencyId);
			if (safeBody.earnedLoyaltyPoints !== undefined)
				updateData.earned_loyalty_points = Number(safeBody.earnedLoyaltyPoints);

			const imageFile = concessionImagesService.extractImage(rawFiles);
			const hasImageUpdate = imageFile !== undefined;

			if (Object.keys(updateData).length === 0 && !hasImageUpdate)
				throw new ValidationError('No se proporcionaron datos para actualizar', []);

			const { imageUrl, imageFileId } = await concessionImagesService.uploadProductImage(imageFile);
			if (imageUrl) updateData.image_url = imageUrl;

			try {
				await this._products.update(id, updateData, { transaction });
			} catch (error) {
				await concessionImagesService.rollbackUploadedImages([imageFileId]);
				throw error;
			}

			if (imageUrl && previousImageUrl) {
				imageStorageService
					.deleteImageByUrl(previousImageUrl)
					.catch((err) => Logger.error('updateProduct: failed to delete old image', err));
			}

			return this._products.getFull(id);
		});
	}

	async deleteProduct(id: number) {
		return this._products.transaction(async (transaction: Transaction) => {
			const product = await this._products.getById(id, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!product) throw new NotFoundError('Producto no encontrado');

			const usageCount = await this._comboProducts.count({ product: id, deleted_at: null }, { transaction });
			if (usageCount > 0)
				throw new ConflictError(
					'No se puede eliminar el producto porque pertenece a combos activos',
					'PRODUCT_IN_COMBO',
				);

			await this._products.delete(id, { transaction });
		});
	}

	async findAllProducts(filters?: ProcessedQueryFilters, userId?: number) {
		const rawProducts = await this._products.getAllFull(filters);
		let productList = Array.isArray(rawProducts) ? rawProducts : rawProducts.rows || [];

		let activeQuote = null;
		let cacheData: any = null;

		if (userId) {
			activeQuote = await shoppingSessionService.getActiveQuote(userId);
			if (activeQuote) cacheData = await PricingCacheService.getActiveModifiers();
		}

		const enrichedList = productList.map((p: any) => {
			const productClone = { ...p };

			if (!activeQuote || !cacheData) {
				return productClone;
			}

			const sessionDate = new Date(activeQuote.created_at || Date.now());
			const currentDate = sessionDate.toISOString().split('T')[0];
			const currentTime = sessionDate.toTimeString().split(' ')[0];
			const currentDay = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay();

			const timeContext = { currentDate, currentTime, currentDay };

			const context = {
				modifier_scope: 2, // Confitería
				cinemaId: activeQuote.cinema,
				line_type: p._ProductCategories?.line_type ?? null,
				product_category: p.product_category,
				product: p.id,
				combo: null,
			};

			const basePricing = PricingService.calculateFinalPrice(
				p.price,
				context,
				cacheData.modifiers,
				cacheData.opTypesMap,
				activeQuote.exchange_rates,
				timeContext,
			);

			productClone.pricing = {
				base_price: p.price,
				final_price: basePricing.finalPrice,
				applied_modifiers: basePricing.appliedModifiers,
			};

			productClone.price = basePricing.finalPrice;

			return productClone;
		});

		if (!Array.isArray(rawProducts)) {
			return {
				...rawProducts,
				rows: enrichedList,
			};
		}
		return enrichedList;
	}

	async findProductById(id: number, userId?: number) {
		const p = await this._products.getFull(id);
		if (!p) throw new NotFoundError('Producto no encontrado');

		let activeQuote = null;
		let cacheData: any = null;
		if (userId) {
			activeQuote = await shoppingSessionService.getActiveQuote(userId);
			if (activeQuote) cacheData = await PricingCacheService.getActiveModifiers();
		}

		const productClone = { ...p };

		if (!activeQuote || !cacheData) {
			return productClone;
		}

		const sessionDate = new Date(activeQuote.created_at || Date.now());
		const currentDate = sessionDate.toISOString().split('T')[0];
		const currentTime = sessionDate.toTimeString().split(' ')[0];
		const currentDay = sessionDate.getDay() === 0 ? 7 : sessionDate.getDay();

		const timeContext = { currentDate, currentTime, currentDay };

		const context = {
			modifier_scope: 2, // Confitería
			cinemaId: activeQuote.cinema,
			line_type: p._ProductCategories?.line_type ?? null,
			product_category: p.product_category,
			product: p.id,
			combo: null,
		};

		const basePricing = PricingService.calculateFinalPrice(
			p.price,
			context,
			cacheData.modifiers,
			cacheData.opTypesMap,
			activeQuote.exchange_rates,
			timeContext,
		);

		productClone.pricing = {
			base_price: p.price,
			final_price: basePricing.finalPrice,
			applied_modifiers: basePricing.appliedModifiers,
		};

		productClone.price = basePricing.finalPrice;

		return productClone;
	}

	// ==================== COMBOS ====================

	async updateCombo(
		id: number,
		body: UpdateProductBody & { products?: Array<{ productId: number; quantity: number }> | string },
		rawFiles?: RawFiles,
	) {
		return this._combos.transaction(async (transaction: Transaction) => {
			const combo = await this._combos.getById(id, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!combo) throw new NotFoundError('Combo no encontrado');

			const previousImageUrl: string | null = combo.image_url ?? null;

			const safeBody = body ?? {};
			const updateData: Record<string, any> = {};

			if (safeBody.name !== undefined) updateData.name = safeBody.name;

			if (safeBody.price !== undefined) {
				const price = Number(safeBody.price);
				if (isNaN(price) || price <= 0)
					throw new ValidationError('El precio debe ser un número positivo', ['price']);
				updateData.price = price;
			}

			if (safeBody.currencyId !== undefined) updateData.currency = Number(safeBody.currencyId);
			if (safeBody.earnedLoyaltyPoints !== undefined)
				updateData.earned_loyalty_points = Number(safeBody.earnedLoyaltyPoints);

			const products: Array<{ productId: number; quantity: number }> | undefined =
				safeBody.products === undefined
					? undefined
					: typeof safeBody.products === 'string'
						? JSON.parse(safeBody.products)
						: (safeBody.products as Array<{ productId: number; quantity: number }>);

			const imageFile = concessionImagesService.extractImage(rawFiles);
			const hasImageUpdate = imageFile !== undefined;

			if (Object.keys(updateData).length === 0 && products === undefined && !hasImageUpdate)
				throw new ValidationError('No se proporcionaron datos para actualizar', []);

			const { imageUrl, imageFileId } = await concessionImagesService.uploadComboImage(imageFile);
			if (imageUrl) updateData.image_url = imageUrl;

			try {
				if (Object.keys(updateData).length > 0) await this._combos.update(id, updateData, { transaction });

				if (products !== undefined) {
					await this._comboProducts.deleteByCombo(id, { transaction, force: true });
					if (products.length > 0) {
						const records = products.map(({ productId, quantity }) => ({
							combo: id,
							product: productId,
							quantity,
						}));
						await this._comboProducts.bulkCreate(records, { transaction });
					}
				}
			} catch (error) {
				await concessionImagesService.rollbackUploadedImages([imageFileId]);
				throw error;
			}

			if (imageUrl && previousImageUrl) {
				imageStorageService
					.deleteImageByUrl(previousImageUrl)
					.catch((err) => Logger.error('updateCombo: failed to delete old image', err));
			}

			return this._combos.getFull(id);
		});
	}

	async deleteCombo(id: number) {
		return this._combos.transaction(async (transaction: Transaction) => {
			const combo = await this._combos.getById(id, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!combo) throw new NotFoundError('Combo no encontrado');

			await this._combos.delete(id, { transaction });
		});
	}

	async findComboById(id: number, userId?: number) {
		const c = await this._combos.getFull(id);
		if (!c) throw new NotFoundError('Combo no encontrado');

		let activeQuote = null;
		let cacheData: any = null;

		if (userId) {
			activeQuote = await shoppingSessionService.getActiveQuote(userId);
			if (activeQuote) cacheData = await PricingCacheService.getActiveModifiers();
		}

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
			combo: c.id,
		};

		const basePricing = PricingService.calculateFinalPrice(
			c.price,
			context,
			cacheData.modifiers,
			cacheData.opTypesMap,
			activeQuote.exchange_rates,
			timeContext,
		);

		comboClone.pricing = {
			base_price: c.price,
			final_price: basePricing.finalPrice,
			applied_modifiers: basePricing.appliedModifiers,
		};

		comboClone.price = basePricing.finalPrice;

		return comboClone;
	}

	// ==================== COMBO ITEMS (BOM) ====================

	async addItemsToCombo(comboId: number, items: Array<{ productId: number; quantity: number }>) {
		if (!Array.isArray(items) || items.length === 0)
			throw new ValidationError('Debe enviar al menos un ítem', ['items']);

		return this._combos.transaction(async (transaction: Transaction) => {
			const combo = await this._combos.getById(comboId, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!combo) throw new NotFoundError('Combo no encontrado');

			for (const item of items) {
				if (!item.productId || !item.quantity || item.quantity <= 0)
					throw new ValidationError('Cada ítem debe tener productId y quantity positivos', ['items']);

				const product = await this._products.getById(item.productId, { transaction });
				if (!product) throw new NotFoundError(`Producto con ID ${item.productId} no encontrado`);

				// Verificar si el producto ya está en el combo
				const existing = await this._comboProducts.getOne(
					{
						combo: comboId,
						product: item.productId,
					},
					{ transaction },
				);

				if (existing) {
					throw new ConflictError(
						`El producto con ID ${item.productId} ya está en el combo`,
						'COMBO_ITEM_ALREADY_EXISTS',
					);
				}

				await this._comboProducts.create(
					{
						combo: comboId,
						product: item.productId,
						quantity: item.quantity,
					},
					{ transaction },
				);
			}
		});
	}

	async removeItemFromCombo(comboId: number, itemId: number) {
		// Validar que los parámetros sean números válidos
		if (isNaN(comboId) || isNaN(itemId)) {
			throw new ValidationError('Los identificadores deben ser numéricos', ['id', 'itemId']);
		}

		return this._comboProducts.transaction(async (transaction: Transaction) => {
			const item = await this._comboProducts.getById(itemId, {
				transaction,
				lock: transaction.LOCK.UPDATE,
			});
			if (!item || item.combo !== comboId) throw new NotFoundError('Ítem no encontrado en el combo');

			await this._comboProducts.delete(itemId, { transaction });
		});
	}
}

export default new ConcessionsService();
