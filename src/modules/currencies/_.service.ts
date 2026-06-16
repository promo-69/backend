import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';
import { Op, Transaction } from 'sequelize';

interface CreateCurrencyBody {
	code: string;
	description: string;
	symbol: string;
	isBaseCurrency?: boolean;
}

interface UpdateCurrencyBody {
	code?: string;
	description?: string;
	symbol?: string;
	isBaseCurrency?: boolean;
	is_base_currency?: boolean;
}

export class CurrenciesService extends BaseService {
	constructor() {
		super();
	}

	private get _currencies() {
		return Database.repository('main', 'currencies') as any;
	}

	private get _products() {
		return Database.repository('main', 'products') as any;
	}

	private get _combos() {
		return Database.repository('main', 'combos') as any;
	}

	private get _showtimes() {
		return Database.repository('main', 'showtimes') as any;
	}

	private get _rentalRequests() {
		return Database.repository('main', 'rental-requests') as any;
	}

	async createCurrency(body: CreateCurrencyBody) {
		const { code, description, symbol, isBaseCurrency } = body;

		this.validateRequired({ code, description, symbol }, ['code', 'description', 'symbol']);

		if (isBaseCurrency === true)
			throw new ValidationError('No se puede crear una moneda como moneda base directamente. Utiliza el endpoint específico para esto.', ['isBaseCurrency']);
		if (typeof code !== 'string' || code.trim().length === 0) throw new ValidationError('El código es inválido', ['code']);
		if (typeof description !== 'string' || description.trim().length === 0) throw new ValidationError('La descripción es inválida', ['description']);
		if (typeof symbol !== 'string' || symbol.trim().length === 0) throw new ValidationError('El símbolo es inválido', ['symbol']);

		const existing = await this._currencies.getOne({ code: code.trim() });
		if (existing) throw new ValidationError('Ya existe una moneda con este código', ['code']);

		const createdCurrency = await this._currencies.create({
			code: code.trim(),
			description: description.trim(),
			symbol: symbol.trim(),
			is_base_currency: false,
		});

		return createdCurrency;
	}

	async listCurrencies() {
		return this._currencies.getAll({ attributes: ['id', 'code', 'description', 'symbol', 'is_base_currency'] });
	}

	async getCurrencyById(id: number) {
		const currency = await this._currencies.getById(id, { attributes: ['id', 'code', 'description', 'symbol', 'is_base_currency'] });
		if (!currency) throw new NotFoundError('Moneda no encontrada');
		return currency;
	}

	async updateCurrency(id: number, body: UpdateCurrencyBody) {
		const currency = await this._currencies.getOne({ id });
		if (!currency) throw new NotFoundError('Moneda no encontrada');

		const { code, description, symbol } = body;
		const isBase = body.isBaseCurrency ?? body.is_base_currency;
		const updateData: Record<string, any> = {};

		if (code !== undefined) {
			const trimmedCode = code.trim();
			if (trimmedCode.length === 0) throw new ValidationError('El código no puede estar vacío', ['code']);

			if (trimmedCode !== currency.code) {
				const existing = await this._currencies.getOne({ code: trimmedCode });
				if (existing) throw new ValidationError('Ya existe una moneda con este código', ['code']);
				updateData.code = trimmedCode;
			}
		}

		if (description !== undefined) {
			const trimmedDesc = description.trim();
			if (trimmedDesc.length === 0) throw new ValidationError('La descripción no puede estar vacía', ['description']);
			if (trimmedDesc !== currency.description) updateData.description = trimmedDesc;
		}

		if (symbol !== undefined) {
			const trimmedSymbol = symbol.trim();
			if (trimmedSymbol.length === 0) throw new ValidationError('El símbolo no puede estar vacío', ['symbol']);
			if (trimmedSymbol !== currency.symbol) updateData.symbol = trimmedSymbol;
		}

		if (isBase === false && currency.is_base_currency === true)
			throw new ValidationError('No se puede quitar el estado de moneda base directamente. Para cambiarla, asigne como base a una moneda diferente.', ['is_base_currency']);

		const shouldUpdateBase = isBase === true && !currency.is_base_currency;

		if (Object.keys(updateData).length === 0 && !shouldUpdateBase)
			throw new ValidationError('No se proporcionaron datos válidos para actualizar', []);

		if (shouldUpdateBase) {
			await this._currencies.update({ is_base_currency: true, id: { [Op.ne]: id } }, { is_base_currency: false });
			updateData.is_base_currency = true;
		}

		await this._currencies.update(id, updateData);

		return null;
	}

	async deleteCurrency(id: number) {
		const currency = await this._currencies.getOne({ id });
		if (!currency) throw new NotFoundError('Moneda no encontrada');
		if (currency.is_base_currency === true) throw new ValidationError('No se puede eliminar la moneda base del sistema. Por favor, asigne otra moneda como base primero.', []);
		const product = await this._products.getOne({ currency: id });
		if (product) throw new ValidationError('No se puede eliminar esta moneda porque existen productos activos usándola.', []);
		const combo = await this._combos.getOne({ currency: id });
		if (combo) throw new ValidationError('No se puede eliminar esta moneda porque existen combos activos usándola.', []);
		const showtime = await this._showtimes.getOne({ currency: id });
		if (showtime) throw new ValidationError('No se puede eliminar esta moneda porque existen funciones (showtimes) activas usándola.', []);
		const rental = await this._rentalRequests.getOne({ currency: id, status: { [Op.in]: [1, 3, 4, 5], }, });
		if (rental) throw new ValidationError('No se puede eliminar esta moneda porque existen solicitudes de alquiler activas (status 1,3,4,5) usándola.', []);

		await this._currencies.delete(id);
		return null;
	}
}

export default new CurrenciesService();
