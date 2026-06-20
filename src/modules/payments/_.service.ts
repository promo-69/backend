import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { BankAccountsAttributes } from '@database/repositories/main/bank-accounts.repository.js';
import { ConflictError, NotFoundError } from '@errors/index.js';

export class PaymentsService extends BaseService {
	constructor() {
		super();
	}

	private get _bankAccounts() {
		return Database.repository('main', 'bank-accounts') as any;
	}
	private get _paymentMethods() {
		return Database.repository('main', 'payment-methods') as any;
	}
	private get _banks() {
		return Database.repository('main', 'banks') as any;
	}
	private get _currencies() {
		return Database.repository('main', 'currencies') as any;
	}

	async getPaymentOptions() {
		const methods = await this._paymentMethods.getAll({
			count: false,
			attributes: ['id', 'description', 'requires_reference'],
			relations: [{
				association: '_BankAccounts',
				attributes: ['id', 'bank', 'currency', 'payment_method', 'payment_details'],
				nested: [
					{ association: '_Banks', attributes: ['id', 'name', 'code'] },
					{ association: '_Currencies', attributes: ['id', 'code', 'description', 'symbol'] },
				],
			}],
		});

		const cleanMethods = JSON.parse(JSON.stringify(methods));

		return cleanMethods.map((m: any) => {
			if (Array.isArray(m._BankAccounts))
				if (m._BankAccounts.length === 0) delete m._BankAccounts;

			return m;
		});
	}

	async getBankAccounts(queryFilters: Record<string, any>) {
		return await this._bankAccounts.getAll(queryFilters, {
			count: false,
			relations: [
				{ association: '_Banks', attributes: ['id', 'name', 'code', 'api_url'] },
				{ association: '_Currencies', attributes: ['id', 'code', 'description', 'symbol'] },
				{ association: '_PaymentMethods', attributes: ['id', 'description'] },
			],
		});
	}

	async createBankAccount(body: BankAccountsAttributes) {
		this.validateRequired(body as Record<string, any>, ['bank', 'currency', 'payment_method', 'payment_details']);

		const account = await this._bankAccounts.getOne({ bank: body.bank, currency: body.currency, payment_method: body.payment_method });
		if (account) throw new ConflictError('Cuenta bancaria ya existente');

		if (body.bank) {
			const bank = await this._banks.getById(body.bank);
			if (!bank) throw new NotFoundError('Banco no encontrado');
		}
		if (body.currency) {
			const currency = await this._currencies.getById(body.currency);
			if (!currency) throw new NotFoundError('Moneda no encontrada');
		}
		if (body.payment_method) {
			const paymentMethod = await this._paymentMethods.getById(body.payment_method);
			if (!paymentMethod) throw new NotFoundError('Método de pago no encontrado');
		}

		return await this._bankAccounts.create(body);
	}

	async updateBankAccount(id: number, body: any) {
		const account = await this._bankAccounts.getById(id);
		if (!account) throw new NotFoundError('Cuenta bancaria no encontrada');

		if (body.bank) {
			const bank = await this._banks.getById(body.bank);
			if (!bank) throw new NotFoundError('Banco no encontrado');
		}
		if (body.currency) {
			const currency = await this._currencies.getById(body.currency);
			if (!currency) throw new NotFoundError('Moneda no encontrada');
		}
		if (body.payment_method) {
			const paymentMethod = await this._paymentMethods.getById(body.payment_method);
			if (!paymentMethod) throw new NotFoundError('Método de pago no encontrado');
		}

		await this._bankAccounts.update({ id }, body);
	}

	async deleteBankAccount(id: number) {
		const account = await this._bankAccounts.getById(id);
		if (!account) throw new NotFoundError('Cuenta bancaria no encontrada');

		await this._bankAccounts.delete({ id });
	}
}

export default new PaymentsService();
