import { ControllerBase } from '@bases/controller.base.js';
import { ValidationError } from '@errors';
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

        this.requireBodyField('name');
        this.requireBodyField('openingTime');
        this.requireBodyField('closingTime');

        if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
            throw new ValidationError('El nombre es obligatorio y debe ser una cadena no vacía');
        }

        const data = await CinemasService.createCinema(body, session?.userId);
        return this.created(data, 'Sucursal registrada exitosamente');
    }

    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();

        if (body.name !== undefined && (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0)) {
            throw new ValidationError('El nombre debe ser una cadena no vacía');
        }

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
