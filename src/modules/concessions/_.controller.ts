import { ControllerBase } from '@bases/controller.base.js';
import ConfiteriaService from './_.service.js';

class ConfiteriaController extends ControllerBase {
    constructor() {
        super();
    }

    // Products
    async findAllProducts() {
        const data = await ConfiteriaService.findAllProducts(this.getQueryFilters());
        return data;
    }

    async findProductById() {
        const { id } = this.getParams();
        const data = await ConfiteriaService.findProductById(Number(id));
        return this.success(data, 'Producto obtenido exitosamente');
    }

    async createProduct() {
        const body = this.getBody();
        const data = await ConfiteriaService.createProduct(body);
        return this.created(data, 'Producto registrado exitosamente');
    }

    async updateProduct() {
        const { id } = this.getParams();
        const body = this.getBody();
        await ConfiteriaService.updateProduct(Number(id), body);
        return this.success(null, 'Producto actualizado exitosamente');
    }

    // Combos
    async findAllCombos() {
        const data = await ConfiteriaService.findAllCombos(this.getQueryFilters());
        return data;
    }

    async findComboById() {
        const { id } = this.getParams();
        const data = await ConfiteriaService.findComboById(Number(id));
        return this.success(data, 'Combo obtenido exitosamente');
    }

    async createCombo() {
        const body = this.getBody();
        const data = await ConfiteriaService.createCombo(body);
        return this.created(data, 'Combo registrado exitosamente');
    }

    async updateCombo() {
        const { id } = this.getParams();
        const body = this.getBody();
        await ConfiteriaService.updateCombo(Number(id), body);
        return this.success(null, 'Combo actualizado exitosamente');
    }

    // Inventario
    async findInventoryByCinema() {
        const { cinemaId } = this.getParams();
        const data = await ConfiteriaService.findInventoryByCinema(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    async replenishInventory() {
        const { cinemaId, productId } = this.getParams();
        const { quantity, remarks } = this.getBody();
        const session = this.getSession<any>();
        await ConfiteriaService.replenishInventory(
            Number(cinemaId),
            Number(productId),
            quantity,
            session.userId,
            remarks,
        );
        return this.created(null, 'Reposición de inventario registrada exitosamente');
    }
}

export default new ConfiteriaController();
