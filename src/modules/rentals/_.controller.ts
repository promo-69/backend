import { ControllerBase } from '@bases/controller.base.js';
import RentalsService from './_.service.js';
import { AuthError } from '@errors';

class RentalsController extends ControllerBase {
    // GET /rentals/requests (gerente de sucursal)
    async findAll() {
        const session = this.getSession<any>();
        const data = await RentalsService.findAllByCinema(session.cinemaId, this.getQueryFilters());
        return this.success(data, 'Solicitudes de alquiler obtenidas exitosamente');
    }

    // GET /rentals/requests/me (cliente autenticado)
    async findMine() {
        const session = this.getSession<any>();
        if (!session.customerId) {
            throw new AuthError('No se pudo identificar al cliente. Vuelve a iniciar sesión.', {
                code: 'MISSING_CUSTOMER_ID',
            });
        }
        const data = await RentalsService.findMyRequests(session.customerId, this.getQueryFilters());
        return this.success(data, 'Mis solicitudes de alquiler obtenidas exitosamente');
    }

    // GET /rentals/admin/requests (superadmin / backoffice global)
    async findAllAdmin() {
        const query = this.getQuery();
        const data = await RentalsService.findAllRequests({
            ...this.getQueryFilters(),
            status: query.status ? Number(query.status) : undefined,
            startDate: query.startDate as string,
            endDate: query.endDate as string,
        });
        return this.success(data, 'Listado global de solicitudes');
    }

    // GET /rentals/requests/:id
    async findById() {
        const session = this.getSession<any>();
        const { id } = this.getParams();
        const data = await RentalsService.findById(Number(id), session.cinemaId);
        return this.success(data, 'Solicitud de alquiler obtenida exitosamente');
    }

    // POST /rentals/requests
    async create() {
        const session = this.getSession<any>();
        const body = this.getBody();
        const data = await RentalsService.createRequest(body, session?.customerId);
        return this.created(data, 'Solicitud de alquiler enviada a revisión.');
    }

    // PATCH /rentals/requests/:id/status
    async updateStatus() {
        const session = this.getSession<any>();
        const { id } = this.getParams();
        const body = this.getBody();
        await RentalsService.updateStatus(Number(id), body, session.cinemaId);
        return this.success(
            null,
            body.status === 2
                ? 'Solicitud aprobada. La sala queda bloqueada por 48 h hasta confirmar el pago.'
                : 'Solicitud rechazada.',
        );
    }

    // PATCH /rentals/requests/:id/payment
    async confirmPayment() {
        const session = this.getSession<any>();
        const { id } = this.getParams();
        await RentalsService.confirmPayment(Number(id), session?.customerId, session?.cinemaId);
        return this.success(null, 'Pago confirmado. La reserva de sala está activa.');
    }
}

export default new RentalsController();
