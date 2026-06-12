import { ControllerBase } from '@bases/controller.base.js';
import SpecialEventsService from './_.service.js';

class SpecialEventsController extends ControllerBase {
    constructor() {
        super();
    }

    // =========================================================================
    //  PÚBLICOS
    // =========================================================================

    async findAll() {
        const data = await SpecialEventsService.getPublicEvents(this.getQueryFilters());
        return this.success(data, 'Eventos especiales obtenidos exitosamente');
    }

    async getUpcoming() {
        const data = await SpecialEventsService.getUpcomingEvents(this.getQueryFilters());
        return this.success(data, 'Próximos eventos especiales obtenidos exitosamente');
    }

    async getBillboard() {
        const query = this.getQuery();
        const cinemaId = query.cinemaId ? Number(query.cinemaId) : undefined;
        const data = await SpecialEventsService.getPublicBillboard(cinemaId);
        return this.success(data, 'Cartelera de eventos especiales obtenida exitosamente');
    }

    async findById() {
        const { id } = this.getParams();
        const data = await SpecialEventsService.getPublicEventDetail(Number(id));
        return this.success(data, 'Evento especial obtenido exitosamente');
    }

    async getPublicShowtimes() {
        const { id } = this.getParams();
        const query = this.getQuery();
        const cinemaId = query.cinemaId ? Number(query.cinemaId) : undefined;
        const data = await SpecialEventsService.getPublicEventShowtimes(Number(id), cinemaId!);
        return this.success(data, 'Funciones del evento obtenidas exitosamente');
    }

    // =========================================================================
    //  ADMINISTRATIVOS
    // =========================================================================

    async findAllAdmin() {
        const data = await SpecialEventsService.getAdminEvents(this.getQueryFilters());
        return this.success(data, 'Eventos especiales obtenidos exitosamente');
    }

    async findByIdAdmin() {
        const { id } = this.getParams();
        const data = await SpecialEventsService.getAdminEventDetail(Number(id));
        return this.success(data, 'Evento especial obtenido exitosamente');
    }

    async getAdminShowtimes() {
        const query = this.getQuery();
        const session = this.getSession<any>();

        const cinemaId =
            session?.role === 'SUPER_ADMIN' ? (query.cinemaId ? Number(query.cinemaId) : undefined) : session?.cinemaId;

        const data = await SpecialEventsService.getAdminEventShowtimes({
            ...this.getQueryFilters(),
            cinemaId,
            eventId: query.eventId ? Number(query.eventId) : undefined,
            startDate: query.startDate as string | undefined,
            endDate: query.endDate as string | undefined,
            onlyFuture: query.onlyFuture !== 'false',
        });

        return this.success(data, 'Funciones de eventos especiales obtenidas exitosamente');
    }

    async create() {
        const body = this.getBody();
        const req = this.getRequest();
        const data = await SpecialEventsService.createEvent(body, req.files as any);
        return this.created(data, 'Evento especial registrado exitosamente en el catálogo.');
    }

    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const req = this.getRequest();
        const data = await SpecialEventsService.updateEvent(Number(id), body, req.files as any);
        return this.success(data, 'Evento especial actualizado exitosamente.');
    }

    async remove() {
        const { id } = this.getParams();
        await SpecialEventsService.deleteEvent(Number(id));
        return this.success(null, 'Evento especial eliminado del catálogo exitosamente.');
    }
}

export default new SpecialEventsController();
