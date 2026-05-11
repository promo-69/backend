import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CinemasModel from '@database/models/main/cinemas.model.js';

export interface CinemasAttributes {
    id?: number;
    name: string;
    address?: string;
    phone?: string;
    opening_time: any;
    closing_time: any;
    deleted_at?: Date;
}

export interface CinemaFull extends CinemasAttributes {
    _Status: { description: string };
}

class CinemasRepository extends SequelizeRepositoryBase<CinemasAttributes, number> {
    constructor() {
        super(CinemasModel);
    }

    private get _relations() {
        return [
            {
                association: '_Status',
                attributes: ['description'],
                required: true,
            },
        ];
    }

    async getFull(id: number): Promise<CinemaFull | null> {
        return this.getOne({ id }, { relations: this._relations }) as Promise<CinemaFull | null>;
    }

    async getAllFull(filters?: any): Promise<{ rows: CinemaFull[]; count: number }> {
        return this.getAllActive({ ...filters, count: true, relations: this._relations }) as Promise<{
            rows: CinemaFull[];
            count: number;
        }>;
    }

    async getByName(name: string): Promise<CinemasAttributes | null> {
        return this.getOne({ name }) as Promise<CinemasAttributes | null>;
    }
}

export default new CinemasRepository();
