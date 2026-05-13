import { ControllerBase } from '@bases/controller.base.js';
import SeatsService from './_.service.js';

class SeatsController extends ControllerBase {
	constructor() {
		super();
	}

	// POST /api/v1/rooms/:id/seats
	async create() {
		const { id } = this.getParams();
		const body = this.getBody();
		await SeatsService.createSeat(Number(id), body);
		return this.created(null, 'Asiento agregado exitosamente.');
	}

	// PATCH /api/v1/seats/:id
	async update() {
		const { id } = this.getParams();
		const body = this.getBody();
		await SeatsService.updateSeat(Number(id), body);
		return this.success(null, 'Asiento actualizado correctamente.');
	}

	// DELETE /api/v1/seats/:id
	async remove() {
		const { id } = this.getParams();
		await SeatsService.deleteSeat(Number(id));
		return this.success(null, 'Asiento eliminado de la sala.');
	}
}

export default new SeatsController();
