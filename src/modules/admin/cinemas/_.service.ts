import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';

export class CinemasService extends BaseService {
    constructor() {
        super();
    }

    private get _cinemas() {
        return Database.repository('main', 'cinemas') as any;
    }

    async findAllCinemas(filters?: any) {
        return this._cinemas.getAll(filters || {});
    }

    async findCinemaById(id: number) {
        return this._cinemas.getById(id);
    }

    async createCinema(cinemaData: any) {
        return this._cinemas.create(cinemaData);
    }

    async updateCinema(id: number, cinemaData: any) {
        return this._cinemas.update(id, cinemaData);
    }

    async deleteCinema(id: number) {
        return this._cinemas.delete(id);
    }
}

export default new CinemasService();
