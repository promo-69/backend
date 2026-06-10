import { ControllerBase } from '@bases/controller.base.js';
import EmployeesService from './_.service.js';

class EmployeesController extends ControllerBase {
    /* GET /employees */
    async findAll() {
        const session = this.getSession<any>();
        const data = await EmployeesService.findAllEmployees(session.cinemaId, this.getQueryFilters());
        return this.success(data, 'Empleados obtenidos exitosamente');
    }

    /* GET /employees/:id */
    async findById() {
        const session = this.getSession<any>();
        const { id } = this.getParams();
        const data = await EmployeesService.findEmployeeById(Number(id), session.cinemaId);
        return this.success(data, 'Empleado encontrado');
    }

    /* POST /employees */
    async create() {
        const session = this.getSession<any>();
        const employeeData = this.getBody();
        const data = await EmployeesService.createEmployee(employeeData, session);
        return this.created(data, 'Empleado registrado exitosamente');
    }

    /* PATCH /employees/:id */
    async update() {
        const { id } = this.getParams();
        const employeeData = this.getBody();
        await EmployeesService.updateEmployee(Number(id), employeeData);
        return this.success(null, 'Empleado actualizado exitosamente');
    }

    /* PATCH /employees/:id/position */
    async changePosition() {
        const { id } = this.getParams();
        const positionData = this.getBody();
        const data = await EmployeesService.changeEmployeePosition(Number(id), positionData);
        return this.success(data, 'Cargo actualizado exitosamente');
    }

    /* DELETE /employees/:id */
    async delete() {
        const { id } = this.getParams();
        await EmployeesService.deleteEmployee(Number(id));
        return this.success(null, 'Empleado desactivado exitosamente');
    }
}

export default new EmployeesController();
