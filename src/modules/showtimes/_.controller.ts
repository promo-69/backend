import { ControllerBase } from '@bases/controller.base.js';
import ShowtimesService from './_.service.js';

class ShowtimesController extends ControllerBase {
	constructor() {
		super();
	}

	async findAll() {
		const data = await ShowtimesService.findAll(this.getQueryFilters());
		return data;
	}

	async findById() {
		const { id } = this.getParams();
		const data = await ShowtimesService.findById(Number(id));
		return this.success(data, 'Función obtenida exitosamente');
	}

	async create() {
		const body = this.getBody();
		const session = this.getSession<any>();
		const data = await ShowtimesService.createShowtime(body, session?.userId);
		return this.created(data, 'Función programada exitosamente');
	}

	async update() {
		const { id } = this.getParams();
		const body = this.getBody();
		await ShowtimesService.updateShowtime(Number(id), body);
		return this.success(null, 'Función actualizada exitosamente');
	}

	async cancel() {
		const { id } = this.getParams();
		await ShowtimesService.cancelShowtime(Number(id));
		return this.success(null, 'Función cancelada exitosamente');
	}
}

export default new ShowtimesController();
