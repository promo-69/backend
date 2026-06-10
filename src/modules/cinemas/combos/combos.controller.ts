import { ControllerBase } from '@bases/controller.base.js';
import ComboManagementService from '@services/combo-management.service.js';
import ConcessionsService from '../../concessions/_.service.js';
class CinemaCombosController extends ControllerBase {
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await ComboManagementService.findAllCombos({
            ...this.getQueryFilters(),
            cinemaId: Number(cinemaId),
        });
        return data;
    }

    async create() {
        const { cinemaId } = this.getParams();
        const body = this.getBody();
        const req = this.getRequest();
        const data = await ComboManagementService.createCombo(body, req.files as any, Number(cinemaId));
        return this.created(data, 'Combo registrado exitosamente');
    }

    async update() {
        const { id, cinemaId } = this.getParams();
        const body = this.getBody();
        const req = this.getRequest();
        await ConcessionsService.updateCombo(Number(id), body, req.files as any, Number(cinemaId));
        return this.success(null, 'Combo actualizado exitosamente');
    }

    async delete() {
        const { id, cinemaId } = this.getParams();
        await ConcessionsService.deleteCombo(Number(id), Number(cinemaId));
        return this.success(null, 'Combo eliminado exitosamente');
    }

    async addItems() {
        const { id, cinemaId } = this.getParams();
        const { items } = this.getBody();
        await ConcessionsService.addItemsToCombo(Number(id), items, Number(cinemaId));
        return this.created(null, 'Ítems agregados al combo exitosamente');
    }

    async removeItems() {
        const { id, itemId, cinemaId } = this.getParams();
        await ConcessionsService.removeItemFromCombo(Number(id), Number(itemId), Number(cinemaId));
        return this.success(null, 'Ítem eliminado del combo exitosamente');
    }
}

export default new CinemaCombosController();
