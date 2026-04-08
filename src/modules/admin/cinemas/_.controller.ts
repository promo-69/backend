import { ControllerBase } from '@bases/controller.base.js';
import { NotFoundError, ValidationError } from '@errors';
import CinemasService from './_.service.js';

class CinemasController extends ControllerBase {
    async findAll() {
        const data = await CinemasService.findAllCinemas(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await CinemasService.findCinemaById(Number(id));

        if (!data) {
            throw new NotFoundError('Cinema', id);
        }

        return data;
    }

    async create() {
        const cinemaData = this.getBody();

        // Validate required fields
        this.requireBodyField('name');
        this.requireBodyField('opening_time');
        this.requireBodyField('closing_time');

        // Additional validation
        if (!cinemaData.name || typeof cinemaData.name !== 'string' || cinemaData.name.trim().length === 0) {
            throw new ValidationError('Name is required and must be a non-empty string');
        }

        const data = await CinemasService.createCinema(cinemaData);
        this.created(data, 'Cinema created successfully');
    }

    async update() {
        const { id } = this.getParams();
        const cinemaData = this.getBody();

        // Check if cinema exists
        const existingCinema = await CinemasService.findCinemaById(Number(id));
        if (!existingCinema) {
            throw new NotFoundError('Cinema', id);
        }

        // Validate required fields if provided
        if (cinemaData.name !== undefined && (!cinemaData.name || typeof cinemaData.name !== 'string' || cinemaData.name.trim().length === 0)) {
            throw new ValidationError('Name must be a non-empty string');
        }

        const affectedRows = await CinemasService.updateCinema(Number(id), cinemaData);
        this.updated({ affectedRows }, 'Cinema updated successfully');
    }

    async delete() {
        const { id } = this.getParams();

        // Check if cinema exists
        const existingCinema = await CinemasService.findCinemaById(Number(id));
        if (!existingCinema) {
            throw new NotFoundError('Cinema', id);
        }

        await CinemasService.deleteCinema(Number(id));
        this.noContent();
    }
}

export default new CinemasController();
