import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import SeatsModel from '@database/models/main/seats.model.js';

export interface SeatsAttributes {
    id?: number;
    room: number;
    row_identifier: string;
    column_number: number;
    seat_category: number;
    seat_condition: number;
    status: number;
}

export interface SeatFull extends SeatsAttributes {
    _SeatCategory: { description: string };
    _SeatCondition: { description: string };
    _Status: { description: string };
}

class SeatsRepository extends SequelizeRepositoryBase<SeatsAttributes, number> {
    constructor() {
        super(SeatsModel);
    }

    private get _relations() {
        return [
            { association: '_SeatCategory', attributes: ['description'], required: true },
            { association: '_SeatCondition', attributes: ['description'], required: true },
            { association: '_Status', attributes: ['description'], required: true },
        ];
    }

    async getById(id: number): Promise<SeatFull | null> {
        return this.getOne({ id }, { relations: this._relations }) as Promise<SeatFull | null>;
    }

    async getAllByRoom(roomId: number, filters?: any): Promise<{ rows: SeatFull[]; count: number }> {
        return this.getAll({ ...filters, count: true, relations: this._relations }, { room: roomId }) as Promise<{
            rows: SeatFull[];
            count: number;
        }>;
    }

    async getActiveByRoom(roomId: number): Promise<SeatFull[]> {
        return this.getAll({ count: false, relations: this._relations }, { room: roomId, status: 1 }) as Promise<
            SeatFull[]
        >;
    }

    async deleteByRoom(roomId: number, operationOptions?: any): Promise<number> {
        return this.delete({ room: roomId }, operationOptions) as Promise<number>;
    }

    async countByRoom(roomId: number): Promise<number> {
        return this.count({ room: roomId, status: 1 });
    }
}

export default new SeatsRepository();
