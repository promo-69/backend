import { ControllerBase } from '@bases/controller.base.js';
import PaymentsService from './_.service.js';

class PaymentsController extends ControllerBase {
	constructor() {
		super();
	}

	async getPaymentOptions() {
		return await PaymentsService.getPaymentOptions();
	}

	async getBankAccounts() {
		return await PaymentsService.getBankAccounts(this.getQuery());
	}

	async createBankAccount() {
		const account = await PaymentsService.createBankAccount(this.getBody());

		this.created(account, 'Cuenta bancaria creada correctamente');
	}

	async updateBankAccount() {
		await PaymentsService.updateBankAccount(Number(this.getParams().id), this.getBody());

		this.updated(null, 'Cuenta bancaria actualizada correctamente');
	}

	async deleteBankAccount() {
		await PaymentsService.deleteBankAccount(Number(this.getParams().id));

		this.success(null, 'Cuenta bancaria eliminada correctamente');
	}
}

export default new PaymentsController();
