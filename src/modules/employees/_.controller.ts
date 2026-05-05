import { ControllerBase } from '@bases/controller.base.js';
import EmployeesService from './_.service.js';

class EmployeesController extends ControllerBase {
    async findAll() {
        const data = await EmployeesService.findAllEmployees(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        return EmployeesService.findEmployeeById(Number(id));
    }

    async create() {
        const employeeData = this.getBody();
        const data = await EmployeesService.createEmployee(employeeData);
        this.created(data, 'Employee created successfully');
    }

    async update() {
        const { id } = this.getParams();
        const employeeData = this.getBody();
        const affectedRows = await EmployeesService.updateEmployee(Number(id), employeeData);
        this.updated({ affectedRows }, 'Employee updated successfully');
    }

    async delete() {
        const { id } = this.getParams();
        await EmployeesService.deleteEmployee(Number(id));
        this.noContent();
    }

    async changePosition() {
        const { id } = this.getParams();
        const positionData = this.getBody();
        const data = await EmployeesService.changeEmployeePosition(Number(id), positionData);
        this.created(data, 'Employee position changed successfully');
    }
}

export default new EmployeesController();