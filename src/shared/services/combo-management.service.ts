import { Database } from '@database/index.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';
import { concessionImagesService } from '@services/concession-images.service.js';
import { imageStorageService } from '@services/image-storage.service.js';
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

    async findAllCombos(filters?: any) {
        const options: any = {
            count: true,
            ...filters,
        };
        if (filters?.cinemaId) {
            options.where = { cinema: filters.cinemaId };
        }
        return this._combos.getAll(options);
    }
}

export default new ComboManagementService();
