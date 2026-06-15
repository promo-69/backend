import { ControllerBase } from '@bases/controller.base.js';
import InventoryManagementService from '@services/inventory-management.service.js';

class CinemaInventoryController extends ControllerBase {
    // GET /cinemas/:cinemaId/inventory — auditoría remota (contexto explícito)
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await InventoryManagementService.getStockByCinema(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    // GET /cinemas/:cinemaId/inventory/products/:productId — ficha de producto + stock
    async findProductStock() {
        const { cinemaId, productId } = this.getParams();
        const data = await InventoryManagementService.getProductStockByCinema(Number(cinemaId), Number(productId));
        return this.success(data, 'Stock del producto obtenido exitosamente');
    }

    // GET /cinemas/:cinemaId/inventory/:id — detalle del registro + movimientos
    async findById() {
        const { id } = this.getParams();
        const data = await InventoryManagementService.getInventoryWithMovements(Number(id));
        return this.success(data, 'Detalle de inventario obtenido');
    }

    // POST /cinemas/:cinemaId/inventory/products/:productId — habilita un producto en la sucursal
    async provisionProduct() {
        const { cinemaId, productId } = this.getParams();
        const body = this.getBody();
        const data = await InventoryManagementService.provisionProductInCinema(
            Number(cinemaId),
            Number(productId),
            body?.minimumStock ?? 0,
        );
        return this.created(data, 'Producto habilitado en el inventario de la sucursal exitosamente');
    }

    // POST /cinemas/:cinemaId/inventory/:id/movements — reabastecimiento desde almacén central
    async addMovements() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        const data = await InventoryManagementService.registerMovements(Number(id), body, session.userId);
        return this.created(data, 'Movimientos registrados exitosamente');
    }
}

export default new CinemaInventoryController();
