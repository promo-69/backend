import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { concessionImagesService } from '@services/concession-images.service.js';
import { imageStorageService } from '@services/image-storage.service.js';
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

    async findAllProducts(filters?: ProcessedQueryFilters) {
        return this._products.getAllFull(filters);
    }

    async findProductById(id: number) {
        const p = await this._products.getFull(id);
        if (!p) throw new NotFoundError('Producto no encontrado');
        return p;
    }

    // ==================== COMBOS ====================

    async createCombo(body: CreateComboBody, rawFiles?: RawFiles, cinemaId?: number) {
        const { name, sku, description } = body;

        const price = Number(body.price);
        const currencyId = Number(body.currencyId);
        const earnedLoyaltyPoints =
            body.earnedLoyaltyPoints !== undefined ? Number(body.earnedLoyaltyPoints) : undefined;
        const products: Array<{ productId: number; quantity: number }> =
            typeof body.products === 'string' ? JSON.parse(body.products) : body.products;

        this.validateRequired({ name, sku, description, currencyId, price } as any, [
            'name',
            'sku',
            'description',
            'currencyId',
            'price',
        ]);

        if (!Array.isArray(products) || products.length === 0)
            throw new ValidationError('El combo debe tener al menos un producto', ['products']);

        if (isNaN(price) || price <= 0) throw new ValidationError('El precio debe ser un número positivo', ['price']);

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

    async findAllCombos(filters?: ProcessedQueryFilters & { cinemaId?: number }) {
        const options: any = {
            count: true,
            relations: this._combos.relations,
            ...filters,
        };
        if (filters?.cinemaId) {
            options.where = { cinema: filters.cinemaId };
        }
        return this._combos.getAll(options);
    }

    async findComboById(id: number) {
        const c = await this._combos.getFull(id);
        if (!c) throw new NotFoundError('Combo no encontrado');
        return c;
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
