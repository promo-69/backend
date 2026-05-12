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

class CinemasRepository extends SequelizeRepositoryBase<CinemasAttributes, number> {
	constructor() {
		super(CinemasModel);
	}

	private get _relations() {
		return [];
	}

	async getFull(id: number): Promise<CinemasAttributes | null> {
		return this.getOne({ id }, { relations: this._relations }) as Promise<CinemasAttributes | null>;
	}

	async getAllFull(filters?: any): Promise<{ rows: CinemasAttributes[]; count: number }> {
		return this.getAll({ ...filters, count: true, relations: this._relations }) as Promise<{
			rows: CinemasAttributes[];
			count: number;
		}>;
	}

	async getByName(name: string): Promise<CinemasAttributes | null> {
		return this.getOne({ name }) as Promise<CinemasAttributes | null>;
	}
}

export default new CinemasRepository();
