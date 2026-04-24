import { ControllerBase } from '@bases/controller.base.js';
import UsersService from './_.service.js';

class UsersController extends ControllerBase {
	constructor() {
		super();
	}

	async createAccount() {
		const payload = this.getBody();
		await UsersService.createAdministrativeAccount(payload);

		return this.getResponse().status(200).json({
            status: 'success',
            message: 'Cuenta de usuario generada exitosamente.'
        });
	}

	async changeStatus() {
		const { id } = this.getParams();
		const { status } = this.getBody();

		const result = await UsersService.updateUserStatus(Number(id), Number(status));

		return this.getResponse().status(200).json({
            status: result.status,
            message: result.message
        });
	}
}

export default new UsersController();
