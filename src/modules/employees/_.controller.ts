import { ControllerBase } from '@bases/controller.base.js';
import { NotFoundError, ValidationError } from '@errors';
import EmployeesService from './_.service.js';

class EmployeesController extends ControllerBase {
    async findAll() {
        const data = await EmployeesService.findAllEmployees(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await EmployeesService.findEmployeeById(Number(id));

        if (!data) {
            throw new NotFoundError('Employee', id);
        }

        return data;
    }

    async create() {
        const employeeData = this.getBody();

        // Validate required fields
        this.requireBodyField('document_number');
        this.requireBodyField('first_name');
        this.requireBodyField('last_name');
        this.requireBodyField('employee_code');
        this.requireBodyField('job_position');
        this.requireBodyField('cinema');
        this.requireBodyField('start_date');

        const data = await EmployeesService.createEmployee(employeeData);
        this.created(data, 'Employee created successfully');
    }

    async update() {
        const { id } = this.getParams();
        const employeeData = this.getBody();

        // Check if employee exists
        const existingEmployee = await EmployeesService.findEmployeeById(Number(id));
        if (!existingEmployee) {
            throw new NotFoundError('Employee', id);
        }

        // Validate fields
        if (employeeData.employee_code !== undefined && (!employeeData.employee_code || typeof employeeData.employee_code !== 'string' || employeeData.employee_code.trim().length === 0)) {
            throw new ValidationError('employee_code must be a non-empty string');
        }

        const affectedRows = await EmployeesService.updateEmployee(Number(id), employeeData);
        this.updated({ affectedRows }, 'Employee updated successfully');
    }

    async delete() {
        const { id } = this.getParams();

        // Check if employee exists
        const existingEmployee = await EmployeesService.findEmployeeById(Number(id));
        if (!existingEmployee) {
            throw new NotFoundError('Employee', id);
        }

        await EmployeesService.deleteEmployee(Number(id));
        this.noContent();
    }

    async changePosition() {
        const { id } = this.getParams();
        const positionData = this.getBody();

        // Validate required fields
        this.requireBodyField('job_position');
        this.requireBodyField('cinema');
        this.requireBodyField('start_date');

        const data = await EmployeesService.changeEmployeePosition(Number(id), positionData);
        this.created(data, 'Employee position changed successfully');
    }
}

export default new EmployeesController();