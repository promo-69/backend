import { ControllerBase } from '@bases/controller.base.js';
import CinemasService from './_.service.js';

class CinemasController extends ControllerBase {
    async findAll() {
        const data = await CinemasService.findAllCinemas(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await CinemasService.findCinemaById(Number(id));
        return data;
    }

    async create() {
        const cinemaData = this.getBody();
        const data = await CinemasService.createCinema(cinemaData);
        this.created(data, 'Cinema created successfully');
    }

    async update() {
        const { id } = this.getParams();
        const cinemaData = this.getBody();
        const affectedRows = await CinemasService.updateCinema(Number(id), cinemaData);
        this.updated({ affectedRows }, 'Cinema updated successfully');
    }

    async delete() {
        const { id } = this.getParams();
        const affectedRows = await CinemasService.deleteCinema(Number(id));
        this.success({ affectedRows }, 'Cinema deleted successfully');
    }
}

export default new CinemasController();
