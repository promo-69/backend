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
    private get _inventories() {
        return Database.repository('main', 'inventories') as any;
    }
    private get _inventoryMovements() {
        return Database.repository('main', 'inventory-movements') as any;
    }
    private get _cinemas() {
        return Database.repository('main', 'cinemas') as any;
    }
    private get _productCategories() {
        return Database.repository('main', 'product-categories') as any;
    }

    // --- HU-OPERATIVA-29: Registrar producto ---
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

    // --- HU-OPERATIVA-30: Crear combo ---
    async createCombo(body: CreateComboBody, rawFiles?: RawFiles) {
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

    // --- HU-OPERATIVA-31: Editar producto ---
    async updateProduct(id: number, body: UpdateProductBody, rawFiles?: RawFiles) {
        const product = await this._products.getFull(id);
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
            await this._products.update(id, updateData);
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
    }

    // --- HU-OPERATIVA-31: Editar combo ---
    async updateCombo(
        id: number,
        body: UpdateProductBody & { products?: Array<{ productId: number; quantity: number }> | string },
        rawFiles?: RawFiles,
    ) {
        const combo = await this._combos.getFull(id);
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
            await this._combos.transaction(async (transaction: Transaction) => {
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
            });
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
    }

    // --- HU-OPERATIVA-34: Registrar reposición de inventario ---
    async replenishInventory(cinemaId: number, productId: number, quantity: number, userId: number, remarks?: string) {
        if (!Number.isInteger(quantity) || quantity <= 0)
            throw new ValidationError('La cantidad debe ser un entero positivo', ['quantity']);

        const cinema = await this._cinemas.getFull(cinemaId);
        if (!cinema) throw new NotFoundError('Sucursal no encontrada');

        const product = await this._products.getFull(productId);
        if (!product) throw new NotFoundError('Producto no encontrado');

        await this._inventories.transaction(async (transaction: Transaction) => {
            let inventory = await this._inventories.getOne({ cinema: cinemaId, product: productId });

            if (!inventory) {
                inventory = await this._inventories.create(
                    { cinema: cinemaId, product: productId, stock: 0 },
                    { transaction },
                );
            }

            const newStock = inventory.stock + quantity;
            await this._inventories.update(inventory.id, { stock: newStock }, { transaction });

            await this._inventoryMovements.create(
                {
                    inventory: inventory.id,
                    operation_type: 3,
                    quantity,
                    user: userId,
                    remarks: remarks ?? null,
                },
                { transaction },
            );
        });

        return null;
    }

    // --- Queries ---
    async findAllProducts(filters?: ProcessedQueryFilters) {
        return this._products.getAllFull(filters);
    }

    async findAllCombos(filters?: ProcessedQueryFilters) {
        return this._combos.getAllFull(filters);
    }

    async findProductById(id: number) {
        const p = await this._products.getFull(id);
        if (!p) throw new NotFoundError('Producto no encontrado');
        return p;
    }

    async findComboById(id: number) {
        const c = await this._combos.getFull(id);
        if (!c) throw new NotFoundError('Combo no encontrado');
        return c;
    }

    async findInventoryByCinema(cinemaId: number, filters?: ProcessedQueryFilters) {
        return this._inventories.getAllByCinema(cinemaId, filters);
    }

    async findInventoryGroupedByCategory(cinemaId: number) {
        const inventory = await this._inventories.getAllByCinema(cinemaId, {
            include: ['_Product._ProductCategory'],
        });

        const grouped: Record<number, { categoryId: number; categoryName: string; products: any[] }> = {};

        for (const item of inventory) {
            const product = item._Product;
            if (!product) continue;
            const cat = product._ProductCategory;
            const catId = cat?.id ?? 0;
            const catName = cat?.description ?? 'Sin categoría';

            if (!grouped[catId]) {
                grouped[catId] = { categoryId: catId, categoryName: catName, products: [] };
            }
            grouped[catId].products.push({
                productId: product.id,
                name: product.name,
                sku: product.sku,
                stock: item.stock,
                price: product.price,
                earnedLoyaltyPoints: product.earned_loyalty_points,
                image_url: product.image_url,
            });
        }

        return Object.values(grouped);
    }

    async findAllCategories(filters?: ProcessedQueryFilters) {
        return this._productCategories.getAll(filters);
    }

    async findCategoryById(id: number) {
        const cat = await this._productCategories.getFull(id);
        if (!cat) throw new NotFoundError('Categoría no encontrada');
        return cat;
    }

    async createCategory(body: { name: string; description?: string }) {
        const { name, description } = body;
        this.validateRequired({ name } as any, ['name']);
        const existing = await this._productCategories.getOne({ name });
        if (existing) throw new ConflictError('Ya existe una categoría con ese nombre', 'CATEGORY_NAME_DUPLICATE');
        const created = await this._productCategories.create({ name, description: description ?? null });
        return this._productCategories.getFull(created.id);
    }

    async updateCategory(id: number, body: { name?: string; description?: string }) {
        const cat = await this._productCategories.getFull(id);
        if (!cat) throw new NotFoundError('Categoría no encontrada');
        const updateData: Record<string, any> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (Object.keys(updateData).length === 0)
            throw new ValidationError('No se proporcionaron datos para actualizar', []);
        await this._productCategories.update(id, updateData);
        return null;
    }

    async deleteCategory(id: number) {
        const cat = await this._productCategories.getFull(id);
        if (!cat) throw new NotFoundError('Categoría no encontrada');
        await this._productCategories.delete(id);
        return null;
    }
}

export default new ConcessionsService();
