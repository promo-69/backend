import { ControllerBase } from '@bases/controller.base.js';
import CinemasService from './_.service.js';

class CinemasController extends ControllerBase {
    constructor() {
        super();
    }

    async findAll() {
        const data = await CinemasService.findAll(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await CinemasService.findById(Number(id));
        return this.success(data, 'Sucursal obtenida exitosamente');
    }

    async create() {
        const body = this.getBody();
        const session = this.getSession<any>();

        const data = await CinemasService.createCinema(body, session?.userId);
        return this.created(data, 'Sucursal registrada exitosamente');
    }

    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();

        const data = await CinemasService.updateCinema(Number(id), body, session?.userId);
        return this.updated(data, 'Sucursal actualizada exitosamente');
    }

    async remove() {
        const { id } = this.getParams();
        const session = this.getSession<any>();
        const data = await CinemasService.deleteCinema(Number(id), session?.userId);
        return this.success(data, 'Sucursal eliminada exitosamente');
    }
}

export default new CinemasController();
