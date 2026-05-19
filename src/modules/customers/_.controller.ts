import { ControllerBase } from '@bases/controller.base.js';
import CustomersService from './_.service.js';

class CustomersController extends ControllerBase {
    constructor() {
        super();
    }

    /* GET /customers - Búsqueda por cédula (útil en taquilla) */
    async findAll() {
        const data = await CustomersService.findAllCustomers(this.getQueryFilters());
        return data;
    }

    /* POST /customers - Registro rápido en taquilla (solo people + customers, sin usuario) */
    async create() {
        const body = this.getBody();
        const data = await CustomersService.createCustomer(body);
        return this.created(data, 'Cliente creado exitosamente');
    }

    /* GET /customers/:id - Expediente del cliente + historial de compras */
    async findById() {
        const { id } = this.getParams();
        const data = await CustomersService.findCustomerById(Number(id));
        return this.success(data, 'Cliente encontrado');
    }

    /* PUT /customers/:id - Corrección de datos biográficos en people */
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await CustomersService.updateCustomer(Number(id), body);
        return this.success(null, 'Cliente actualizado exitosamente');
    }

    /* PATCH /customers/:id/loyalty-points - Ajuste administrativo de puntos de lealtad */
    async adjustLoyaltyPoints() {
        const { id } = this.getParams();
        const body = this.getBody();
        await CustomersService.adjustLoyaltyPoints(Number(id), body);
        return this.success(null, 'Puntos de lealtad ajustados exitosamente');
    }
}

export default new CustomersController();
