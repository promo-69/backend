import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type Transaction } from 'sequelize';

interface CreateProductBody {
    name: string;
    sku: string;
    productCategory: number;
    currencyId: number;
    price: number;
    earnedLoyaltyPoints?: number;
}

interface CreateComboBody {
    name: string;
    sku: string;
    description: string;
    currencyId: number;
    price: number;
    earnedLoyaltyPoints?: number;
    products: Array<{ productId: number; quantity: number }>;
}

interface UpdateProductBody {
    name?: string;
    price?: number;
    currencyId?: number;
    earnedLoyaltyPoints?: number;
}

export class ConfiteriaService extends BaseService {
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

    // --- HU-OPERATIVA-29: Registrar producto ---
    async createProduct(body: CreateProductBody) {
        const { name, sku, productCategory, currencyId, price, earnedLoyaltyPoints } = body;

        this.validateRequired({ name, sku, productCategory, currencyId, price } as any, [
            'name',
            'sku',
            'productCategory',
            'currencyId',
            'price',
        ]);

        if (typeof price !== 'number' || price <= 0)
            throw new ValidationError('El precio debe ser un número positivo', ['price']);

        const existing = await this._products.getOne({ sku });
        if (existing) throw new ConflictError('Ya existe un producto con ese SKU', 'PRODUCT_SKU_DUPLICATE');

        const created = await this._products.create({
            name,
            sku,
            product_category: productCategory,
            currency: currencyId,
            price,
            earned_loyalty_points: earnedLoyaltyPoints ?? null,
            status: 1,
        });

        return this._products.getFull(created.id);
    }

    // --- HU-OPERATIVA-30: Crear combo ---
    async createCombo(body: CreateComboBody) {
        const { name, sku, description, currencyId, price, earnedLoyaltyPoints, products } = body;

        this.validateRequired({ name, sku, description, currencyId, price } as any, [
            'name',
            'sku',
            'description',
            'currencyId',
            'price',
        ]);

        if (!Array.isArray(products) || products.length === 0)
            throw new ValidationError('El combo debe tener al menos un producto', ['products']);

        if (typeof price !== 'number' || price <= 0)
            throw new ValidationError('El precio debe ser un número positivo', ['price']);

        const existing = await this._combos.getOne({ sku });
        if (existing) throw new ConflictError('Ya existe un combo con ese SKU', 'COMBO_SKU_DUPLICATE');

        const created = await this._combos.transaction(async (transaction: Transaction) => {
            const combo = await this._combos.create(
                {
                    name,
                    sku,
                    description,
                    currency: currencyId,
                    price,
                    earned_loyalty_points: earnedLoyaltyPoints ?? null,
                    status: 1,
                },
                { transaction },
            );

            const comboProductRecords = products.map(({ productId, quantity }) => ({
                combo: combo.id,
                product: productId,
                quantity,
                status: 1,
            }));
            await this._comboProducts.bulkCreate(comboProductRecords, { transaction });

            return combo;
        });

        return this._combos.getFull(created.id);
    }

    // --- HU-OPERATIVA-31: Editar producto o combo ---
    async updateProduct(id: number, body: UpdateProductBody) {
        const product = await this._products.getFull(id);
        if (!product || product.status !== 1) throw new NotFoundError('Producto no encontrado');

        const updateData: Record<string, any> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.price !== undefined) {
            if (typeof body.price !== 'number' || body.price <= 0)
                throw new ValidationError('El precio debe ser un número positivo', ['price']);
            updateData.price = body.price;
        }
        if (body.currencyId !== undefined) updateData.currency = body.currencyId;
        if (body.earnedLoyaltyPoints !== undefined) updateData.earned_loyalty_points = body.earnedLoyaltyPoints;

        if (Object.keys(updateData).length === 0)
            throw new ValidationError('No se proporcionaron datos para actualizar', []);

        await this._products.update(id, updateData);
        return null;
    }

    async updateCombo(
        id: number,
        body: UpdateProductBody & { products?: Array<{ productId: number; quantity: number }> },
    ) {
        const combo = await this._combos.getFull(id);
        if (!combo || combo.status !== 1) throw new NotFoundError('Combo no encontrado');

        const { products, ...rest } = body;
        const updateData: Record<string, any> = {};

        if (rest.name !== undefined) updateData.name = rest.name;
        if (rest.price !== undefined) {
            if (typeof rest.price !== 'number' || rest.price <= 0)
                throw new ValidationError('El precio debe ser un número positivo', ['price']);
            updateData.price = rest.price;
        }
        if (rest.currencyId !== undefined) updateData.currency = rest.currencyId;
        if (rest.earnedLoyaltyPoints !== undefined) updateData.earned_loyalty_points = rest.earnedLoyaltyPoints;

        if (Object.keys(updateData).length === 0 && !products)
            throw new ValidationError('No se proporcionaron datos para actualizar', []);

        await this._combos.transaction(async (transaction: Transaction) => {
            if (Object.keys(updateData).length > 0) await this._combos.update(id, updateData, { transaction });

            if (products !== undefined) {
                await this._comboProducts.deleteByCombo(id, { transaction });
                if (products.length > 0) {
                    const records = products.map(({ productId, quantity }) => ({
                        combo: id,
                        product: productId,
                        quantity,
                        status: 1,
                    }));
                    await this._comboProducts.bulkCreate(records, { transaction });
                }
            }
        });

        return null;
    }

    // --- HU-OPERATIVA-34: Registrar reposición de inventario ---
    async replenishInventory(cinemaId: number, productId: number, quantity: number, userId: number, remarks?: string) {
        if (!Number.isInteger(quantity) || quantity <= 0)
            throw new ValidationError('La cantidad debe ser un entero positivo', ['quantity']);

        const cinema = await this._cinemas.getFull(cinemaId);
        if (!cinema || cinema.status !== 1) throw new NotFoundError('Sucursal no encontrada');

        const product = await this._products.getFull(productId);
        if (!product || product.status !== 1) throw new NotFoundError('Producto no encontrado');

        await this._inventories.transaction(async (transaction: Transaction) => {
            // Buscar o crear registro de inventario para esta sucursal+producto
            let inventory = await this._inventories.getOne({ cinema: cinemaId, product: productId });

            if (!inventory) {
                inventory = await this._inventories.create(
                    { cinema: cinemaId, product: productId, stock: 0, status: 1 },
                    { transaction },
                );
            }

            const newStock = inventory.stock + quantity;
            await this._inventories.update(inventory.id, { stock: newStock }, { transaction });

            // Registrar movimiento — operation_type 3 = Entrada de Inventario (seeder)
            await this._inventoryMovements.create(
                {
                    inventory: inventory.id,
                    operation_type: 3,
                    quantity,
                    user: userId,
                    remarks: remarks ?? null,
                    status: 1,
                },
                { transaction },
            );
        });

        return null;
    }

    async findAllProducts(filters?: ProcessedQueryFilters) {
        return this._products.getAllFull(filters);
    }

    async findAllCombos(filters?: ProcessedQueryFilters) {
        return this._combos.getAllFull(filters);
    }

    async findProductById(id: number) {
        const p = await this._products.getFull(id);
        if (!p || p.status !== 1) throw new NotFoundError('Producto no encontrado');
        return p;
    }

    async findComboById(id: number) {
        const c = await this._combos.getFull(id);
        if (!c || c.status !== 1) throw new NotFoundError('Combo no encontrado');
        return c;
    }

    async findInventoryByCinema(cinemaId: number, filters?: ProcessedQueryFilters) {
        return this._inventories.getAllByCinema(cinemaId, filters);
    }
}

export default new ConfiteriaService();
