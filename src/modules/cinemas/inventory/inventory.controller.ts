import { ControllerBase } from '@bases/controller.base.js';
import InventoryManagementService from '@services/inventory-management.service.js';

class CinemaInventoryController extends ControllerBase {
	async findAll() {
		const { cinemaId } = this.getParams();
		const data = await InventoryManagementService.getStockByCinema(Number(cinemaId), this.getQueryFilters());
		return data;
	}

	async addMovements() {
		const { cinemaId, id } = this.getParams();
		const body = this.getBody();
		const session = this.getSession<any>();

		await InventoryManagementService.registerMovements(Number(id), body, session.userId, Number(cinemaId));
		return this.created(null, 'Movimientos registrados exitosamente');
	}
}

export default new CinemaInventoryController();
