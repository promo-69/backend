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
	// Model fields
	cinema?: number;
	startDate?: string | Date;
	endDate?: string | Date;
	startTime?: string; // HH:MM:SS
	endTime?: string; // HH:MM:SS
	lineType?: number;
	bookingType?: number;
	movie?: number;
	roomType?: number;
	currency?: number;
	targetCurrency?: number;
	targetCurrencyCondition?: boolean;
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
		const {
			description,
			modifierScope,
			operationType,
			isPercentage,
			value,
			weekDay,
			startDate,
			endDate,
			startTime,
			endTime,
		} = body;

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

		// modifierScope must be 1,2 or 3
		if (typeof modifierScope !== 'number' || ![1, 2, 3].includes(modifierScope))
			throw new ValidationError('modifierScope inválido. Debe ser 1, 2 o 3', ['modifierScope']);

		if (typeof operationType !== 'number')
			throw new ValidationError('operationType debe ser un número', ['operationType']);

		if (typeof isPercentage !== 'boolean')
			throw new ValidationError('isPercentage debe ser booleano', ['isPercentage']);

		if (weekDay !== undefined && weekDay !== null && (typeof weekDay !== 'number' || weekDay < 1 || weekDay > 7))
			throw new ValidationError('weekDay debe ser un número entre 1 y 7', ['weekDay']);

		// Validate dates if provided (validate each when present; if both present validate ordering)
		if (startDate !== undefined && startDate !== null) {
			const s = new Date(startDate as any);
			if (isNaN(s.getTime())) throw new ValidationError('startDate inválido', ['startDate']);
		}
		if (endDate !== undefined && endDate !== null) {
			const e = new Date(endDate as any);
			if (isNaN(e.getTime())) throw new ValidationError('endDate inválido', ['endDate']);
		}
		if (startDate !== undefined && startDate !== null && endDate !== undefined && endDate !== null) {
			const s = new Date(startDate as any);
			const e = new Date(endDate as any);
			if (e < s) throw new ValidationError('endDate no puede ser anterior a startDate', ['endDate']);
		}

		// Validate time format HH:MM or HH:MM:SS when provided
		const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
		if (startTime !== undefined && startTime !== null && !timeRegex.test(String(startTime)))
			throw new ValidationError('startTime inválido', ['startTime']);
		if (endTime !== undefined && endTime !== null && !timeRegex.test(String(endTime)))
			throw new ValidationError('endTime inválido', ['endTime']);

		this._validateScopeLogic(modifierScope, body);

		const createdModifier = await this._priceModifiers.create({
			description,
			modifier_scope: modifierScope,
			operation_type: operationType,
			is_percentage: isPercentage,
			value,
			audience_category: body.audienceCategory ?? null,
			week_day: weekDay ?? null,
			seat_category: body.seatCategory ?? null,
			projection_type: body.projectionType ?? null,
			product_category: body.productCategory ?? null,
			product: body.product ?? null,
			combo: body.combo ?? null,
			cinema: body.cinema ?? null,
			start_date: startDate ? new Date(startDate as any) : null,
			end_date: endDate ? new Date(endDate as any) : null,
			start_time: body.startTime ?? null,
			end_time: body.endTime ?? null,
			line_type: body.lineType ?? null,
			booking_type: body.bookingType ?? null,
			movie: body.movie ?? null,
			room_type: body.roomType ?? null,
			currency: body.currency ?? null,
			target_currency: body.targetCurrency ?? null,
			target_currency_condition: body.targetCurrencyCondition ?? false,
		});

		return createdModifier;
	}

	// --- HU-OPERATIVA-15 (Edición): Actualizar regla ---
	async updatePriceModifier(id: number, body: UpdatePriceModifierBody) {
		const modifier = await this._priceModifiers.getOne({ id });
		if (!modifier) throw new NotFoundError('Regla de precio no encontrada');

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

	async listPriceModifiers() {
		return this._priceModifiers.getAll({ count: false });
	}

	async getPriceModifierById(id: number) {
		const modifier = await this._priceModifiers.getOne({ id });
		if (!modifier) throw new NotFoundError('Regla de precio no encontrada');
		return modifier;
	}

	// --- HU-OPERATIVA-14/15 (Desactivación): Soft delete ---
	async deletePriceModifier(id: number) {
		const modifier = await this._priceModifiers.getOne({ id });
		if (!modifier) throw new NotFoundError('Regla de precio no encontrada');

		await this._priceModifiers.delete(id);
		return null;
	}
}

export default new PriceModifiersService();
