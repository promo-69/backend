import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';

export class EmployeesService extends BaseService {
    constructor() {
        super();
    }

    private get _employees() {
        return Database.repository('main', 'employees') as any;
    }

    private get _people() {
        return Database.repository('main', 'people') as any;
    }

    private get _jobPositions() {
        return Database.repository('main', 'job-positions') as any;
    }

    private get _cinemas() {
        return Database.repository('main', 'cinemas') as any;
    }

    private get _employeePositions() {
        return Database.repository('main', 'employee-positions') as any;
    }

    async findAllEmployees(filters?: any) {
        return this._employees.getAll(filters || {});
    }

    async findEmployeeById(id: number) {
        return this._employees.getById(id);
    }

    async createEmployee(employeeData: any) {
        // Validate required fields
        if (!employeeData.document_number) {
            throw new ValidationError('document_number is required');
        }
        if (!employeeData.first_name) {
            throw new ValidationError('first_name is required');
        }
        if (!employeeData.last_name) {
            throw new ValidationError('last_name is required');
        }
        if (!employeeData.employee_code) {
            throw new ValidationError('employee_code is required');
        }
        if (!employeeData.job_position) {
            throw new ValidationError('job_position is required');
        }
        if (!employeeData.cinema) {
            throw new ValidationError('cinema is required');
        }
        if (!employeeData.start_date) {
            throw new ValidationError('start_date is required');
        }

        // Check if job_position exists
        const jobPosition = await this._jobPositions.getById(employeeData.job_position);
        if (!jobPosition) {
            throw new ValidationError('Invalid job_position');
        }

        // Check if cinema exists
        const cinema = await this._cinemas.getById(employeeData.cinema);
        if (!cinema) {
            throw new ValidationError('Invalid cinema');
        }

        // Check if person exists by document_number
        let person = await this._people.getOne({ document_number: employeeData.document_number });
        if (!person) {
            // Create person
            const personData = {
                document_number: employeeData.document_number,
                first_name: employeeData.first_name,
                last_name: employeeData.last_name,
                gender: employeeData.gender,
                phone_number: employeeData.phone_number,
                email: employeeData.email,
                birth_date: employeeData.birth_date,
                status: 1,
            };
            person = await this._people.create(personData);
        }

        // Create employee
        const employee = await this._employees.create({
            person: person.id,
            employee_code: employeeData.employee_code,
            status: 1,
        });

        // Create employee position
        await this._employeePositions.create({
            employee: employee.id,
            job_position: employeeData.job_position,
            cinema: employeeData.cinema,
            start_date: employeeData.start_date,
            end_date: employeeData.end_date,
            salary_base: employeeData.salary_base,
            status: 1,
        });

        return employee;
    }

    async updateEmployee(id: number, employeeData: any) {
        // Validate fields if provided
        if (employeeData.employee_code !== undefined && !employeeData.employee_code) {
            throw new ValidationError('employee_code cannot be empty');
        }

        return this._employees.update(id, employeeData);
    }

    async deleteEmployee(id: number) {
        return this._employees.update(id, { status: 0 });
    }

    async changeEmployeePosition(employeeId: number, positionData: any) {
        // Validate required fields
        if (!positionData.job_position) {
            throw new ValidationError('job_position is required');
        }
        if (!positionData.cinema) {
            throw new ValidationError('cinema is required');
        }
        if (!positionData.start_date) {
            throw new ValidationError('start_date is required');
        }

        // Check if employee exists
        const employee = await this._employees.getById(employeeId);
        if (!employee) {
            throw new NotFoundError('Employee', employeeId);
        }

        // Check if job_position exists
        const jobPosition = await this._jobPositions.getById(positionData.job_position);
        if (!jobPosition) {
            throw new ValidationError('Invalid job_position');
        }

        // Check if cinema exists
        const cinema = await this._cinemas.getById(positionData.cinema);
        if (!cinema) {
            throw new ValidationError('Invalid cinema');
        }

        // End current position if exists
        const currentPositions = await this._employeePositions.getAll({
            employee: employeeId,
            status: 1,
        });
        for (const pos of currentPositions) {
            await this._employeePositions.update(pos.id, { end_date: new Date(), status: 0 });
        }

        // Create new position
        const newPosition = await this._employeePositions.create({
            employee: employeeId,
            job_position: positionData.job_position,
            cinema: positionData.cinema,
            start_date: positionData.start_date,
            end_date: positionData.end_date,
            salary_base: positionData.salary_base,
            status: 1,
        });

        return newPosition;
    }
}

export default new EmployeesService();