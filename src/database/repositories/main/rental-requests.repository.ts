import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import RentalRequestsModel from '@database/models/main/rental-requests.model.js';

export interface RentalRequestsAttributes {
    id?: number;
    customer: number;
    cinema: number;
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

    get listRelations() {
        return [
            { association: '_Statuses', attributes: ['id', 'description'] },
            {
                association: '_Customers',
                attributes: ['id', 'person'],
                include: [
                    {
                        association: '_People',
                        attributes: ['first_name', 'last_name', 'personal_email', 'phone_number'],
                    },
                ],
            },
            {
                association: '_Rooms',
                attributes: ['id', 'name'],
                required: false,
            },
            {
                association: '_Cinemas',
                attributes: ['id', 'name'],
                required: false,
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
                include: [
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
                attributes: ['id', 'name'],
                required: false,
            },
            {
                association: '_Cinemas',
                attributes: ['id', 'name'],
                required: false,
            },
            { association: '_EventTypes', attributes: ['id', 'description'] },
            { association: '_Currencies', attributes: ['id', 'code', 'symbol'], required: false },
        ];
    }

    // Vista para listados administrativos globales (superadmin)
    get adminListRelations() {
        return [
            { association: '_Statuses', attributes: ['id', 'description'] },
            {
                association: '_Customers',
                attributes: ['id', 'person'],
                include: [
                    {
                        association: '_People',
                        attributes: ['first_name', 'last_name', 'personal_email'],
                    },
                ],
            },
            {
                association: '_Rooms',
                attributes: ['id', 'name'],
                required: false,
            },
            {
                association: '_Cinemas',
                attributes: ['id', 'name'],
                required: false,
            },
        ];
    }

    async getFull(id: number) {
        return this.getById(id, {
            attributes: [
                'id',
                'customer',
                'cinema',
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

    // Obtener solicitudes por sucursal (para gerentes)
    async findByCinema(cinemaId: number, filters?: any) {
        return this.getAll(
            {
                count: true,
                attributes: [
                    'id',
                    'event_name',
                    'requested_start_time',
                    'status',
                    'price',
                ],
                relations: this.listRelations,
                ...filters,
            },
            { cinema: cinemaId, ...(filters?.where || {}) },
        );
    }

    // Obtener solicitudes por cliente (para clientes autenticados)
    async findByCustomer(customerId: number, filters?: any) {
        return this.getAll(
            {
                count: true,
                attributes: [
                    'id',
                    'event_name',
                    'requested_start_time',
                    'status',
                ],
                relations: [{ association: '_Statuses', attributes: ['id', 'description'] }],
                ...filters,
            },
            { customer: customerId, ...(filters?.where || {}) },
        );
    }
}

export default new RentalRequestsRepository();
