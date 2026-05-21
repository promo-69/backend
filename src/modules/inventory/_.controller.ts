import { ControllerBase } from '@bases/controller.base.js';
import InventoryService from './_.service.js';
import { ValidationError } from '@errors';

class InventoryController extends ControllerBase {
    // GET /inventory — stock de la sede del usuario (cinemaId del JWT)
    async findAll() {
        const session = this.getSession<any>();
        if (!session.cinemaId) throw new Error('No se pudo determinar la sucursal');
        const data = await InventoryService.getStockByCinema(session.cinemaId, this.getQueryFilters());
        return data;
    }

    // GET /inventory/:id — detalle del registro + últimos movimientos
    async findById() {
        const { id } = this.getParams();
        const data = await InventoryService.getInventoryDetail(Number(id));
        return this.success(data, 'Detalle de inventario obtenido');
    }

    // POST /inventory/:id/movements — registrar movimientos
    async addMovements() {
        const { id } = this.getParams();
        const payload = this.getBody();
        if (!payload || !Array.isArray(payload.movements)) {
            throw new ValidationError('El cuerpo debe contener un arreglo "movements"', []);
        }
        const session = this.getSession<any>();
        await InventoryService.registerMovements(Number(id), payload.movements, session.userId);
        return this.created(null, 'Movimientos registrados exitosamente');
    }
}

export default new InventoryController();
