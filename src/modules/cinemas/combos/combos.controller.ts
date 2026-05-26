import { ControllerBase } from '@bases/controller.base.js';
import ComboManagementService from '@services/combo-management.service.js';

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
}

export default new CinemaCombosController();
