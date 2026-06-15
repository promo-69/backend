import { ControllerBase } from '@bases/controller.base.js';
import InventoryService from './_.service.js';
import { ValidationError } from '@errors';

class InventoryController extends ControllerBase {
    // GET /inventory — stock de la sede del usuario (cinemaId del JWT o ?cinemaId=)
    async findAll() {
        const session = this.getSession<any>();
        const query = this.getQuery();

        const cinemaId = session?.cinemaId ?? (query.cinemaId ? Number(query.cinemaId) : undefined);

        if (!cinemaId) {
            throw new ValidationError(
                'No se pudo determinar la sucursal. Especificá "cinemaId" en la query string o iniciá sesión con una sucursal asignada.',
            );
        }

        const data = await InventoryService.getStockByCinema(cinemaId, this.getQueryFilters());
        return data;
    }

    // GET /inventory/products/:productId — ficha de producto + stock en la sucursal del usuario
    async findProductStock() {
        const session = this.getSession<any>();
        const { productId } = this.getParams();
        const query = this.getQuery();

        const cinemaId = session?.cinemaId ?? (query.cinemaId ? Number(query.cinemaId) : undefined);

        if (!cinemaId) {
            throw new ValidationError(
                'No se pudo determinar la sucursal. Especificá "cinemaId" en la query string o iniciá sesión con una sucursal asignada.',
            );
        }

        const data = await InventoryService.getProductStock(cinemaId, Number(productId));
        return this.success(data, 'Stock del producto obtenido exitosamente');
    }

    // GET /inventory/:id — detalle del registro + movimientos
    async findById() {
        const { id } = this.getParams();
        const data = await InventoryService.getInventoryDetail(Number(id));
        return this.success(data, 'Detalle de inventario obtenido');
    }

    // POST /inventory/products/:productId — habilita un producto en la sucursal del usuario
    async provisionProduct() {
        const session = this.getSession<any>();
        const { productId } = this.getParams();
        const body = this.getBody();

        const cinemaId = session?.cinemaId ?? (body.cinemaId ? Number(body.cinemaId) : undefined);

        if (!cinemaId) {
            throw new ValidationError(
                'No se pudo determinar la sucursal. Especificá "cinemaId" en el cuerpo o iniciá sesión con una sucursal asignada.',
            );
        }

        const data = await InventoryService.provisionProduct(cinemaId, Number(productId), body.minimumStock);
        return this.created(data, 'Producto habilitado en el inventario de la sucursal exitosamente');
    }

    // POST /inventory/:id/movements — registrar movimientos
    async addMovements() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();

        const data = await InventoryService.registerMovements(Number(id), body, session.userId);
        return this.created(data, 'Movimientos registrados exitosamente');
    }

    // GET /inventory/admin/all — listado global de backoffice (todas las sucursales)
    async findAllAdmin() {
        const data = await InventoryService.getAllInventoryAdmin(this.getQueryFilters());
        return this.success(data, 'Inventario global obtenido exitosamente');
    }
}

export default new InventoryController();
