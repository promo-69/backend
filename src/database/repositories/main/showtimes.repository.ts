import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ShowtimesModel from '@database/models/main/showtimes.model.js';
import { Op } from 'sequelize';

export interface ShowtimesAttributes {
    id?: number;
    movie: number;
    room: number;
    projection_type: number;
    start_time: Date;
    end_time: Date;
    currency: number;
    price: number;
    earned_loyalty_points?: number;
    deleted_at?: Date;
}

class ShowtimesRepository extends SequelizeRepositoryBase<ShowtimesAttributes, number> {
    constructor() {
        super(ShowtimesModel);
    }

    private get _relations() {
        return [
            { association: '_Movies', attributes: ['title', 'duration_minutes'], required: true },
            {
                association: '_RoomBookings',
                attributes: ['start_time', 'end_time'],
                required: true,
                nested: [{ association: '_Rooms', attributes: ['name'], required: true }],
            },
            { association: '_ProjectionTypes', attributes: ['description'], required: true },
            { association: '_Currencies', attributes: ['code', 'symbol'], required: true },
        ];
    }

    async getFull(id: number) {
        return this.getOne({ id }, { relations: this._relations });
    }

    async getAllFull(filters?: any) {
        return this.getAll({ ...filters, count: true, relations: this._relations });
    }

    async getAllByMovie(movieId: number, filters?: any) {
        return this.getAll({ ...filters, count: true, relations: this._relations }, { movie: movieId });
    }

    async getAllByRoom(roomId: number, filters?: any) {
        return this.getAll({ ...filters, count: true, relations: this._relations }, { room: roomId });
    }

    // Detectar solapamiento de horarios en la misma sala
    async hasConflict(roomId: number, startTime: Date, endTime: Date, excludeId?: number): Promise<boolean> {
        const where: any = {
            room: roomId,
            start_time: { [Op.lt]: endTime },
            end_time: { [Op.gt]: startTime },
        };
        if (excludeId) where.id = { [Op.ne]: excludeId };

        const count = await this.count(where);
        return count > 0;
    }
}

export default new ShowtimesRepository();
