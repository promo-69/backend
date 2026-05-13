import { ControllerBase } from '@bases/controller.base.js';
import ConcessionsService from './_.service.js';

class ConcessionsController extends ControllerBase {
    constructor() {
        super();
    }

    // ----- Product Categories -----
    async findAllCategories() {
        const data = await ConcessionsService.findAllCategories(this.getQueryFilters());
        return data;
    }

    async findCategoryById() {
        const { id } = this.getParams();
        const data = await ConcessionsService.findCategoryById(Number(id));
        return this.success(data, 'Categoría obtenida exitosamente');
    }

    async createCategory() {
        const body = this.getBody();
        const data = await ConcessionsService.createCategory(body);
        return this.created(data, 'Categoría registrada exitosamente');
    }

    async updateCategory() {
        const { id } = this.getParams();
        const body = this.getBody();
        await ConcessionsService.updateCategory(Number(id), body);
        return this.success(null, 'Categoría actualizada exitosamente');
    }

    async deleteCategory() {
        const { id } = this.getParams();
        await ConcessionsService.deleteCategory(Number(id));
        return this.success(null, 'Categoría eliminada exitosamente');
    }

    // ----- Products -----
    async findAllProducts() {
        const data = await ConcessionsService.findAllProducts(this.getQueryFilters());
        return data;
    }

    async findProductById() {
        const { id } = this.getParams();
        const data = await ConcessionsService.findProductById(Number(id));
        return this.success(data, 'Producto obtenido exitosamente');
    }

    async createProduct() {
        const body = this.getBody();
        const req = this.getRequest();
        const data = await ConcessionsService.createProduct(body, req.files as any);
        return this.created(data, 'Producto registrado exitosamente');
    }

    async updateProduct() {
        const { id } = this.getParams();
        const body = this.getBody();
        const req = this.getRequest();
        const data = await ConcessionsService.updateProduct(Number(id), body, req.files as any);
        return this.success(data, 'Producto actualizado exitosamente');
    }

    // ----- Combos -----
    async findAllCombos() {
        const data = await ConcessionsService.findAllCombos(this.getQueryFilters());
        return data;
    }

    async findComboById() {
        const { id } = this.getParams();
        const data = await ConcessionsService.findComboById(Number(id));
        return this.success(data, 'Combo obtenido exitosamente');
    }

    async createCombo() {
        const body = this.getBody();
        const req = this.getRequest();
        const data = await ConcessionsService.createCombo(body, req.files as any);
        return this.created(data, 'Combo registrado exitosamente');
    }

    async updateCombo() {
        const { id } = this.getParams();
        const body = this.getBody();
        const req = this.getRequest();
        const data = await ConcessionsService.updateCombo(Number(id), body, req.files as any);
        return this.success(data, 'Combo actualizado exitosamente');
    }

    // ----- Inventario -----
    async findInventoryByCinema() {
        const { cinemaId } = this.getParams();
        const data = await ConcessionsService.findInventoryByCinema(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    // Inventario agrupado por categoría (nuevo)
    async findInventoryGroupedByCategory() {
        const { cinemaId } = this.getParams();
        const data = await ConcessionsService.findInventoryGroupedByCategory(Number(cinemaId));
        return this.success(data, 'Inventario agrupado por categoría');
    }

    async replenishInventory() {
        const { cinemaId, productId } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        await ConcessionsService.replenishInventory(Number(cinemaId), Number(productId), body, session.userId);
        return this.created(null, 'Reposición de inventario registrada exitosamente');
    }
}

export default new ConcessionsController();
