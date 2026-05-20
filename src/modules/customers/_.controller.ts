import { ControllerBase } from '@bases/controller.base.js';
import CustomersService from './_.service.js';

class CustomersController extends ControllerBase {
    constructor() {
        super();
    }

    /* GET /customers — búsqueda por cédula, útil en taquilla */
    async findAll() {
        const data = await CustomersService.findAllCustomers(this.getQueryFilters());
        return data;
    }

    /* POST /customers — registro rápido en taquilla (people + customers, sin usuario) */
    async create() {
        const body = this.getBody();
        const data = await CustomersService.createCustomer(body);
        return this.created(data, 'Cliente registrado exitosamente');
    }

    /* GET /customers/:id — expediente del cliente */
    async findById() {
        const { id } = this.getParams();
        const data = await CustomersService.findCustomerById(Number(id));
        return this.success(data, 'Cliente encontrado');
    }

    /* PATCH /customers/:id — corrección parcial de datos biográficos */
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        await CustomersService.updateCustomer(Number(id), body);
        return this.success(null, 'Cliente actualizado exitosamente');
    }

    /* PATCH /customers/:id/loyalty-points — ajuste manual administrativo de puntos */
    async adjustLoyaltyPoints() {
        const { id } = this.getParams();
        const body = this.getBody();
        await CustomersService.adjustLoyaltyPoints(Number(id), body);
        return this.success(null, 'Puntos de lealtad ajustados exitosamente');
    }
}

export default new CustomersController();
