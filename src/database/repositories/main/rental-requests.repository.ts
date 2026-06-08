import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RentalRequestsModel from '@database/models/main/rental-requests.model.js';

export interface RentalRequestsAttributes {
    id?: number;
    customer: number;
    room: number;
    event_type: number;
    booking?: number | null;
    event_name: string;
    event_description?: string | null;
    event_date: string;
    attendees?: number | null;
    requested_start_time: Date | string;
    requested_end_time: Date | string;
    status: number;
    currency?: number | null;
    price?: number | string | null;
    deleted_at?: Date;
}

class RentalRequestsRepository extends SequelizeRepositoryBase<RentalRequestsAttributes, number> {
    constructor() {
        super(RentalRequestsModel);
    }

    // Vista de lista: carga el estado y, a través de _Customers, la persona.
    // La sala se incluye para poder derivar la sucursal.
    get listRelations() {
        return [
            { association: '_Statuses', attributes: ['id', 'description'] },
            {
                association: '_Customers',
                attributes: ['id', 'person'],
                nested: [
                    {
                        association: '_People',
                        attributes: ['first_name', 'last_name', 'personal_email', 'phone_number'],
                    },
                ],
            },
            {
                association: '_Rooms',
                attributes: ['id', 'name', 'cinema'],
                nested: [{ association: '_Cinemas', attributes: ['id', 'name'] }],
            },
        ];
    }

    // Vista de detalle (GET /:id — gerente):
    // Carga todo lo necesario para evaluar la solicitud antes de aprobarla.
    get detailRelations() {
        return [
            { association: '_Statuses', attributes: ['id', 'description'] },
            {
                association: '_Customers',
                attributes: ['id', 'person'],
                nested: [
                    {
                        association: '_People',
                        attributes: [
                            'id',
                            'first_name',
                            'last_name',
                            'personal_email',
                            'phone_number',
                            'document_number',
                        ],
                    },
                ],
            },
            {
                association: '_Rooms',
                attributes: ['id', 'name', 'cinema'],
                nested: [{ association: '_Cinemas', attributes: ['id', 'name'] }],
            },
            { association: '_EventTypes', attributes: ['id', 'description'] },
            { association: '_Currencies', attributes: ['id', 'code', 'symbol'], required: false },
        ];
    }

    async getFull(id: number) {
        return this.getById(id, {
            attributes: [
                'id',
                'customer',
                'room',
                'event_type',
                'booking',
                'event_name',
                'event_description',
                'event_date',
                'attendees',
                'requested_start_time',
                'requested_end_time',
                'status',
                'currency',
                'price',
            ],
            relations: this.detailRelations,
        });
    }
}

export default new RentalRequestsRepository();
