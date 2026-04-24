import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';

// Reglas del constraint chk_price_modifiers_logic
// scope 1 (Boletería):  product_category, product, combo deben ser NULL
// scope 2 (Dulcería):   audience_category, seat_category, projection_type deben ser NULL
// scope 3 (Global):     todos los campos opcionales deben ser NULL

const SCOPE_FORBIDDEN_FIELDS: Record<number, string[]> = {
    1: ['product_category', 'product', 'combo'],
    2: ['audience_category', 'seat_category', 'projection_type'],
    3: ['audience_category', 'seat_category', 'projection_type', 'product_category', 'product', 'combo'],
};

interface CreatePriceModifierBody {
    description: string;
    modifier_scope: number;
    operation_type: number;
    is_percentage: boolean;
    value: number;
    audience_category?: number;
    week_day?: number;
    seat_category?: number;
    projection_type?: number;
    product_category?: number;
    product?: number;
    combo?: number;
}

interface UpdatePriceModifierBody {
    description?: string;
    value?: number;
    is_percentage?: boolean;
    operation_type?: number;
}

export class PriceModifiersService extends BaseService {
    constructor() {
        super();
    }

    private get _priceModifiers() {
        return Database.repository('main', 'price-modifiers') as any;
    }

    private _validateScopeLogic(modifier_scope: number, body: Record<string, any>): void {
        const forbidden = SCOPE_FORBIDDEN_FIELDS[modifier_scope];
        if (!forbidden) throw new ValidationError('El alcance del modificador no es válido', ['modifier_scope']);

        const violations = forbidden.filter((field) => body[field] !== undefined && body[field] !== null);
        if (violations.length > 0)
            throw new ValidationError(
                `Con el alcance indicado, los siguientes campos no deben enviarse: ${violations.join(', ')}`,
                violations,
            );
    }

    // --- HU-OPERATIVA-14/15: Crear regla de precio ---
    async createPriceModifier(body: CreatePriceModifierBody) {
        const { description, modifier_scope, operation_type, is_percentage, value } = body;

        this.validateRequired({ description, modifier_scope, operation_type, is_percentage, value } as any, [
            'description',
            'modifier_scope',
            'operation_type',
            'is_percentage',
            'value',
        ]);

        if (typeof value !== 'number' || value <= 0)
            throw new ValidationError('El valor debe ser un número positivo', ['value']);

        if (is_percentage && value > 100)
            throw new ValidationError('Un porcentaje no puede superar el 100%', ['value']);

        this._validateScopeLogic(modifier_scope, body);

        await this._priceModifiers.create({
            description,
            modifier_scope,
            operation_type,
            is_percentage,
            value,
            audience_category: body.audience_category ?? null,
            week_day: body.week_day ?? null,
            seat_category: body.seat_category ?? null,
            projection_type: body.projection_type ?? null,
            product_category: body.product_category ?? null,
            product: body.product ?? null,
            combo: body.combo ?? null,
            status: 1,
        });

        return null;
    }

    // --- HU-OPERATIVA-15 (Edición): Actualizar regla ---
    async updatePriceModifier(id: number, body: UpdatePriceModifierBody) {
        const modifier = await this._priceModifiers.getOne({ id });
        if (!modifier || modifier.status !== 1) throw new NotFoundError('Regla de precio no encontrada');

        const { description, value, is_percentage, operation_type } = body;
        const updateData: Record<string, any> = {};

        if (description !== undefined) {
            if (typeof description !== 'string' || description.trim().length === 0)
                throw new ValidationError('La descripción no puede estar vacía', ['description']);
            updateData.description = description.trim();
        }

        if (value !== undefined) {
            if (typeof value !== 'number' || value <= 0)
                throw new ValidationError('El valor debe ser un número positivo', ['value']);
            const effectiveIsPercentage = is_percentage ?? modifier.is_percentage;
            if (effectiveIsPercentage && value > 100)
                throw new ValidationError('Un porcentaje no puede superar el 100%', ['value']);
            updateData.value = value;
        }

        if (is_percentage !== undefined) updateData.is_percentage = is_percentage;
        if (operation_type !== undefined) updateData.operation_type = operation_type;

        if (Object.keys(updateData).length === 0)
            throw new ValidationError('No se proporcionaron datos para actualizar', []);

        await this._priceModifiers.update(id, updateData);
        return null;
    }

    // --- HU-OPERATIVA-14/15 (Desactivación): Soft delete ---
    async deletePriceModifier(id: number) {
        const modifier = await this._priceModifiers.getOne({ id });
        if (!modifier || modifier.status !== 1) throw new NotFoundError('Regla de precio no encontrada');

        await this._priceModifiers.update(id, { status: 4 });
        return null;
    }
}

export default new PriceModifiersService();
