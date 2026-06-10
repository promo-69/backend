import { ControllerBase } from '@bases/controller.base.js';
import InventoryManagementService from '@services/inventory-management.service.js';
import { ValidationError } from '@errors';

class CinemaInventoryController extends ControllerBase {
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await InventoryManagementService.getStockByCinema(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    async addMovements() {
        const { id } = this.getParams();
        const body = this.getBody();
        if (!Array.isArray(body)) throw new ValidationError('El cuerpo debe ser un arreglo de movimientos');
        const session = this.getSession<any>();
        await InventoryManagementService.registerMovements(Number(id), body, session.userId);
        return this.created(null, 'Movimientos registrados exitosamente');
    }
}

export default new CinemaInventoryController();
