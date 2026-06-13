import { ControllerBase } from '@bases/controller.base.js';
import SpecialEventsService from './_.service.js';

class SpecialEventsController extends ControllerBase {
    constructor() { super(); }

    // =========================================================================
    //  CATÁLOGO GLOBAL — sin filtro de sucursal
    // =========================================================================

    async findAll() {
        const data = await SpecialEventsService.getPublicEvents(this.getQueryFilters());
        return this.success(data, 'Eventos especiales obtenidos exitosamente');
    }

    // GET /special-events/upcoming — lifecycle_state = 1 (global)
    async getUpcoming() {
        const data = await SpecialEventsService.getUpcoming(this.getQueryFilters());
        return this.success(data, 'Próximos eventos especiales obtenidos exitosamente');
    }

    // GET /special-events/premiere — lifecycle_state = 2 (global)
    async getOnPremiere() {
        const data = await SpecialEventsService.getOnPremiere(this.getQueryFilters());
        return this.success(data, 'Eventos en estreno obtenidos exitosamente');
    }

    // GET /special-events/now-playing — lifecycle_state = 3 (global)
    async getInBillboard() {
        const data = await SpecialEventsService.getInBillboard(this.getQueryFilters());
        return this.success(data, 'Eventos en cartelera obtenidos exitosamente');
    }

    // GET /special-events/last-days — lifecycle_state = 4 (global)
    async getLastDays() {
        const data = await SpecialEventsService.getLastDays(this.getQueryFilters());
        return this.success(data, 'Eventos en últimos días obtenidos exitosamente');
    }

    // =========================================================================
    //  POR SUCURSAL — cruza lifecycle con funciones reales de la sucursal
    // =========================================================================

    // GET /special-events/by-cinema/:cinemaId/upcoming
    async getUpcomingByCinema() {
        const { cinemaId } = this.getParams();
        const data = await SpecialEventsService.getUpcomingByCinema(Number(cinemaId));
        return this.success(data, 'Próximos eventos especiales obtenidos exitosamente');
    }

    // GET /special-events/by-cinema/:cinemaId/premiere
    async getOnPremiereByCinema() {
        const { cinemaId } = this.getParams();
        const data = await SpecialEventsService.getOnPremiereByCinema(Number(cinemaId));
        return this.success(data, 'Eventos en estreno obtenidos exitosamente');
    }

    // GET /special-events/by-cinema/:cinemaId/now-playing
    async getInBillboardByCinema() {
        const { cinemaId } = this.getParams();
        const data = await SpecialEventsService.getInBillboardByCinema(Number(cinemaId));
        return this.success(data, 'Eventos en cartelera obtenidos exitosamente');
    }

    // GET /special-events/by-cinema/:cinemaId/last-days
    async getLastDaysByCinema() {
        const { cinemaId } = this.getParams();
        const data = await SpecialEventsService.getLastDaysByCinema(Number(cinemaId));
        return this.success(data, 'Eventos en últimos días obtenidos exitosamente');
    }

    // =========================================================================
    //  CARTELERA DE FUNCIONES Y DETALLE
    // =========================================================================

    // GET /special-events/showtimes/billboard?cinemaId=
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
