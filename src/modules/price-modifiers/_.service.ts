import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';

// Reglas del constraint chk_price_modifiers_logic
// scope 1 (Boletería):  product_category, product, combo deben ser NULL
// scope 2 (Dulcería):   audience_category, seat_category, projection_type deben ser NULL
// scope 3 (Global):     todos los campos opcionales deben ser NULL

const SCOPE_FORBIDDEN_FIELDS: Record<number, string[]> = {
	1: ['productCategory', 'product', 'combo'],
	2: ['audienceCategory', 'seatCategory', 'projectionType'],
	3: ['audienceCategory', 'seatCategory', 'projectionType', 'productCategory', 'product', 'combo'],
};

interface CreatePriceModifierBody {
	description: string;
	modifierScope: number;
	operationType: number;
	isPercentage: boolean;
	value: number;
	audienceCategory?: number;
	weekDay?: number;
	seatCategory?: number;
	projectionType?: number;
	productCategory?: number;
	product?: number;
	combo?: number;
}

interface UpdatePriceModifierBody {
	description?: string;
	value?: number;
	isPercentage?: boolean;
	operationType?: number;
}

export class PriceModifiersService extends BaseService {
	constructor() {
		super();
	}

	private get _priceModifiers() {
		return Database.repository('main', 'price-modifiers') as any;
	}

	private _validateScopeLogic(modifierScope: number, body: Record<string, any>): void {
		const forbidden = SCOPE_FORBIDDEN_FIELDS[modifierScope];
		if (!forbidden) throw new ValidationError('El alcance del modificador no es válido', ['modifierScope']);

		const violations = forbidden.filter((field) => body[field] !== undefined && body[field] !== null);
		if (violations.length > 0)
			throw new ValidationError(
				`Con el alcance indicado, los siguientes campos no deben enviarse: ${violations.join(', ')}`,
				violations,
			);
	}

	// --- HU-OPERATIVA-14/15: Crear regla de precio ---
	async createPriceModifier(body: CreatePriceModifierBody) {
		const { description, modifierScope, operationType, isPercentage, value } = body;

		this.validateRequired({ description, modifierScope, operationType, isPercentage, value } as any, [
			'description',
			'modifierScope',
			'operationType',
			'isPercentage',
			'value',
		]);

		if (typeof value !== 'number' || value <= 0)
			throw new ValidationError('El valor debe ser un número positivo', ['value']);

		if (isPercentage && value > 100) throw new ValidationError('Un porcentaje no puede superar el 100%', ['value']);

		this._validateScopeLogic(modifierScope, body);

		await this._priceModifiers.create({
			description,
			modifier_scope: modifierScope,
			operation_type: operationType,
			is_percentage: isPercentage,
			value,
			audience_category: body.audienceCategory ?? null,
			week_day: body.weekDay ?? null,
			seat_category: body.seatCategory ?? null,
			projection_type: body.projectionType ?? null,
			product_category: body.productCategory ?? null,
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

		const { description, value, isPercentage, operationType } = body;
		const updateData: Record<string, any> = {};

		if (description !== undefined) {
			if (typeof description !== 'string' || description.trim().length === 0)
				throw new ValidationError('La descripción no puede estar vacía', ['description']);
			updateData.description = description.trim();
		}

		if (value !== undefined) {
			if (typeof value !== 'number' || value <= 0)
				throw new ValidationError('El valor debe ser un número positivo', ['value']);
			const effectiveIsPercentage = isPercentage ?? modifier.is_percentage;
			if (effectiveIsPercentage && value > 100)
				throw new ValidationError('Un porcentaje no puede superar el 100%', ['value']);
			updateData.value = value;
		}

		if (isPercentage !== undefined) updateData.is_percentage = isPercentage;
		if (operationType !== undefined) updateData.operation_type = operationType;

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
