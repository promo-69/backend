import { ControllerBase } from '@bases/controller.base.js';
import RentalsService from './_.service.js';

class RentalsController extends ControllerBase {
    // GET /rentals/requests - Gerente lista las solicitudes de alquiler de su propio cine.
    // cinemaId extraído del JWT.
    async findAll() {
        const session = this.getSession<any>();
        const data = await RentalsService.findAllByCinema(session.cinemaId, this.getQueryFilters());
        return this.success(data, 'Solicitudes de alquiler obtenidas exitosamente');
    }

    // GET /rentals/requests/me - Cliente autenticado consulta el historial de sus propias solicitudes.
    async findMine() {
        const session = this.getSession<any>();
        const data = await RentalsService.findMyRequests(session.customerId, this.getQueryFilters());
        return this.success(data, 'Mis solicitudes de alquiler obtenidas exitosamente');
    }

    // GET /rentals/requests/:id - Gerente consulta el detalle exhaustivo de una solicitud.
    // cinemaId del JWT se usa para verificar pertenencia.
    async findById() {
        const session = this.getSession<any>();
        const { id } = this.getParams();
        const data = await RentalsService.findById(Number(id), session.cinemaId);
        return this.success(data, 'Solicitud de alquiler obtenida exitosamente');
    }

    // POST /rentals/requests - Formulario público de solicitud de alquiler.
    // Funciona con o sin sesión (optionalAuth).
    // Si hay sesión de cliente, se asocia la solicitud al customerId del JWT.
    async create() {
        const session = this.getSession<any>();
        const body = this.getBody();
        const data = await RentalsService.createRequest(body, session?.customerId);
        return this.created(data, 'Solicitud de alquiler enviada a revisión.');
    }

    // PATCH /rentals/requests/:id/status - Gerente aprueba (→ status 2) o rechaza (→ status 4) la solicitud.
    async updateStatus() {
        const session = this.getSession<any>();
        const { id } = this.getParams();
        const body = this.getBody();
        await RentalsService.updateStatus(Number(id), body, session.cinemaId);
        return this.success(
            null,
            body.status === 2
                ? 'Solicitud aprobada y bloqueada temporalmente en agenda. A la espera del pago del cliente.'
                : 'Estado de la solicitud actualizado exitosamente.',
        );
    }
}

export default new RentalsController();
