import { ControllerBase } from '@bases/controller.base.js';
import InventoryService from './_.service.js';
import { ValidationError } from '@errors';

class InventoryController extends ControllerBase {
    // GET /inventory — stock de la sede del usuario (cinemaId del JWT)
    async findAll() {
        const session = this.getSession<any>();
        if (!session.cinemaId) {
            throw new ValidationError('No se pudo determinar la sucursal del usuario.');
        }
        const data = await InventoryService.getStockByCinema(session.cinemaId, this.getQueryFilters());
        return data;
    }

    // GET /inventory/:id — detalle del registro + movimientos
    async findById() {
        const { id } = this.getParams();
        const data = await InventoryService.getInventoryDetail(Number(id));
        return this.success(data, 'Detalle de inventario obtenido');
    }

    // POST /inventory/:id/movements — registrar movimientos
    async addMovements() {
        const { id } = this.getParams();
        const body = this.getBody();

        if (!Array.isArray(body)) {
            throw new ValidationError('El cuerpo de la solicitud debe ser un arreglo de movimientos');
        }

        const session = this.getSession<any>();
        await InventoryService.registerMovements(Number(id), body, session.userId);
        return this.created(null, 'Movimientos registrados exitosamente');
    }
}

export default new InventoryController();
