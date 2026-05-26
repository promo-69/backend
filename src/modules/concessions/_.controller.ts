import { ControllerBase } from '@bases/controller.base.js';
import ConcessionsService from './_.service.js';
import ComboManagementService from '@services/combo-management.service.js';
import { ValidationError } from '@errors';

class ConcessionsController extends ControllerBase {
    constructor() {
        super();
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
        await ConcessionsService.updateProduct(Number(id), body, req.files as any);
        return this.success(null, 'Producto actualizado exitosamente');
    }

    async deleteProduct() {
        const { id } = this.getParams();
        await ConcessionsService.deleteProduct(Number(id));
        return this.success(null, 'Producto eliminado exitosamente');
    }

    // ----- Combos -----
    async findAllCombos() {
        const session = this.getSession<any>();
        const data = await ComboManagementService.findAllCombos({
            ...this.getQueryFilters(),
            cinemaId: session?.cinemaId,
        });
        return data;
    }

    async findComboById() {
        const { id } = this.getParams();
        const data = await ConcessionsService.findComboById(Number(id));
        return this.success(data, 'Combo obtenido exitosamente');
    }

    async createCombo() {
        const session = this.getSession<any>();
        const body = this.getBody();
        const req = this.getRequest();

        // Permitir que el SUPER_ADMIN pase cinema en el body
        const cinemaId = session?.cinemaId ?? body.cinema;
        if (cinemaId === undefined) {
            throw new ValidationError(
                'No se puede determinar la sucursal. Especificá "cinema" en el cuerpo de la petición o iniciá sesión con una sucursal asignada.',
            );
        }

        const data = await ComboManagementService.createCombo(body, req.files as any, Number(cinemaId));
        return this.created(data, 'Combo registrado exitosamente');
    }

    async updateCombo() {
        const { id } = this.getParams();
        const body = this.getBody();
        const req = this.getRequest();
        await ConcessionsService.updateCombo(Number(id), body, req.files as any);
        return this.success(null, 'Combo actualizado exitosamente');
    }

    async deleteCombo() {
        const { id } = this.getParams();
        await ConcessionsService.deleteCombo(Number(id));
        return this.success(null, 'Combo eliminado exitosamente');
    }

    // ----- Combo Items (BOM) -----
    async addComboItems() {
        const { id } = this.getParams();
        const { items } = this.getBody();
        await ConcessionsService.addItemsToCombo(Number(id), items);
        return this.created(null, 'Ítems agregados al combo exitosamente');
    }

    async removeComboItem() {
        const { id, itemId } = this.getParams();
        await ConcessionsService.removeItemFromCombo(Number(id), Number(itemId));
        return this.success(null, 'Ítem eliminado del combo exitosamente');
    }
}

export default new ConcessionsController();
