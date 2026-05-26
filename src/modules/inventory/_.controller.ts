import { ControllerBase } from '@bases/controller.base.js';
import InventoryService from './_.service.js';

class InventoryController extends ControllerBase {
	// GET /inventory — stock de la sede del usuario (cinemaId del JWT)
	async findAll() {
		const session = this.getSession<any>();
		const data = await InventoryService.getStockByCinema(session.cinemaId, this.getQueryFilters());
		return data;
	}

	// GET /inventory/:id — detalle del registro + movimientos
	async findById() {
		const session = this.getSession<any>();
		const { id } = this.getParams();
		const data = await InventoryService.getInventoryDetail(Number(id), session.cinemaId);
		return this.success(data, 'Detalle de inventario obtenido');
	}

	// POST /inventory/:id/movements — registrar movimientos
	async addMovements() {
		const { id } = this.getParams();
		const body = this.getBody();
		const session = this.getSession<any>();

		await InventoryService.registerMovements(Number(id), body, session.userId, session.cinemaId);
		return this.created(null, 'Movimientos registrados exitosamente');
	}
}

export default new InventoryController();
