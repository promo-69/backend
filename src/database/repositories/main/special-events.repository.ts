import { type RelationConfig, SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import SpecialEventsModel from '@database/models/main/special-events.model.js';

export interface SpecialEventsAttributes {
	id?: number;
	title: string;
	description: string;
	duration_minutes: number;
	age_classification: number;
	lifecycle_state: number;
	trailer_url?: string | null;
	poster_url?: string | null;
	banner_url?: string | null;
	release_date: string;
	end_date?: string | null;
	deleted_at?: Date | null;
}

export interface SpecialEventFull extends SpecialEventsAttributes {
	_AgeClassifications: { description: string };
	_LifecycleStates: { description: string };
}

class SpecialEventsRepository extends SequelizeRepositoryBase<SpecialEventsAttributes, number> {
	constructor() {
		super(SpecialEventsModel);
	}

	private get _relations(): RelationConfig[] {
		return [
			{
				association: '_AgeClassifications',
				attributes: ['description'],
				required: false,
			},
			{
				association: '_LifecycleStates',
				attributes: ['description'],
				required: false,
			},
		];
	}

	private readonly _aliasMap: Record<string, string> = {
		_AgeClassifications: 'age_classification_detail',
		_LifecycleStates: 'lifecycle_state_detail',
	};

	private parseResponse<R>(data: R | null): R | null {
		if (!data) return null;

		if (Array.isArray(data)) return data.map((item) => this.parseResponse(item)) as unknown as R;

		if (typeof data === 'object' && data !== null) {
			const parsed = { ...data } as Record<string, unknown>;

			for (const key of Object.keys(parsed)) {
				if (this._aliasMap[key]) {
					const newKey = this._aliasMap[key];
					parsed[newKey] = parsed[key];
					delete parsed[key];
				}
			}

			return parsed as unknown as R;
		}

		return data;
	}

	async getFull(id: number): Promise<SpecialEventFull | null> {
		const result = await this.getOne({ id }, { relations: this._relations });
		return this.parseResponse(result) as SpecialEventFull | null;
	}

	async getAllFull(filters?: any): Promise<{ rows: SpecialEventFull[]; count: number }> {
		const result = (await this.getAll({ ...filters, count: true, relations: this._relations })) as {
			rows: any[];
			count: number;
		};
		return {
			count: result.count,
			rows: this.parseResponse(result.rows) as SpecialEventFull[],
		};
	}

	async getByLifecycleState(
		stateId: number | number[],
		filters?: any,
	): Promise<{ rows: SpecialEventFull[]; count: number }> {
		const result = (await this.getAll(
			{ ...filters, count: true, relations: this._relations },
			{ lifecycle_state: stateId, deleted_at: null },
		)) as { rows: any[]; count: number };

		return {
			count: result.count,
			rows: this.parseResponse(result.rows) as SpecialEventFull[],
		};
	}
}

export default new SpecialEventsRepository();
