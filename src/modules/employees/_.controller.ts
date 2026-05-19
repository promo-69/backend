import { ControllerBase } from '@bases/controller.base.js';
import EmployeesService from './_.service.js';

class EmployeesController extends ControllerBase {
    /* GET /employees - el cinemaId se extrae del JWT */
    async findAll() {
        const session = this.getSession<any>();
        const data = await EmployeesService.findAllEmployees(session.cinemaId, this.getQueryFilters());
        return data;
    }

    /* GET /employees/:id - el cinemaId se extrae del JWT para verificar pertenencia*/
    async findById() {
        const session = this.getSession<any>();
        const { id } = this.getParams();
        const data = await EmployeesService.findEmployeeById(Number(id), session.cinemaId);
        return this.success(data, 'Employee found');
    }

    /* POST /employees - el cinemaId se toma del JWT, no del body */
    async create() {
        const session = this.getSession<any>();
        const employeeData = this.getBody();
        const data = await EmployeesService.createEmployee(employeeData, session);
        return this.created(data, 'Employee created successfully');
    }

    /* PUT /employees/:id - Actualiza datos biográficos en people y/o employee_code */
    async update() {
        const { id } = this.getParams();
        const employeeData = this.getBody();
        await EmployeesService.updateEmployee(Number(id), employeeData);
        return this.success(null, 'Employee updated successfully');
    }

    /* PUT /employees/:id/position - Cambio de cargo / sucursal (SCD Tipo 2) */
    async changePosition() {
        const { id } = this.getParams();
        const positionData = this.getBody();
        const data = await EmployeesService.changeEmployeePosition(Number(id), positionData);
        return this.success(data, 'Employee position changed successfully');
    }

    /* DELETE /employees/:id - cierra cargo activo, desactiva usuario */
    async delete() {
        const { id } = this.getParams();
        await EmployeesService.deleteEmployee(Number(id));
        return this.success(null, 'Employee deactivated successfully');
    }
}

export default new EmployeesController();
