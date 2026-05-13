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

	private get _users() {
		return Database.repository('main', 'users') as any;
	}

	private normalizeEmployee(employee: any) {
		if (!employee) return null;

		const { deleted_at, _People, ...baseEmployee } = employee;
		return {
			...baseEmployee,
			people: _People || null,
		};
	}

	private async attachUserAndPerson(employee: any) {
		const normalizedEmployee = this.normalizeEmployee(employee);
		if (!normalizedEmployee) return null;

		const _User = normalizedEmployee.person ? await this._users.getByPerson(normalizedEmployee.person) : null;
		return {
			...normalizedEmployee,
			_User,
		};
	}

	async findAllEmployees(filters?: any) {
		const queryOptions = {
			count: true,
			attributes: ['id', 'person', 'employee_code'],
			relations: [
				{
					association: '_People',
					attributes: [
						'id',
						'document_number',
						'first_name',
						'last_name',
						'gender',
						'phone_number',
						'personal_email',
						'birth_date',
					],
				},
			],
		};

		const result = await this._employees.getAll({ ...queryOptions, ...filters });

		if (Array.isArray(result)) {
			return Promise.all(result.map((employee) => this.attachUserAndPerson(employee)));
		}

		return {
			...result,
			rows: await Promise.all(result.rows.map((employee: any) => this.attachUserAndPerson(employee))),
		};
	}

	async findEmployeeById(id: number) {
		const employee = await this._employees.getById(id, {
			attributes: ['id', 'person', 'employee_code'],
			relations: [
				{
					association: '_People',
					attributes: [
						'id',
						'document_number',
						'first_name',
						'last_name',
						'gender',
						'phone_number',
						'personal_email',
						'birth_date',
					],
				},
			],
		});

		if (!employee) throw new NotFoundError('Employee', id);
		return this.attachUserAndPerson(employee);
	}

	async createEmployee(employeeData: any) {
		// Validate required fields
		if (!employeeData.documentNumber) {
			throw new ValidationError('documentNumber is required');
		}
		if (!employeeData.firstName) {
			throw new ValidationError('firstName is required');
		}
		if (!employeeData.lastName) {
			throw new ValidationError('lastName is required');
		}
		if (!employeeData.employeeCode) {
			throw new ValidationError('employeeCode is required');
		}
		if (!employeeData.jobPosition) {
			throw new ValidationError('jobPosition is required');
		}
		if (!employeeData.cinema) {
			throw new ValidationError('cinema is required');
		}
		if (!employeeData.startDate) {
			throw new ValidationError('startDate is required');
		}

		// Check if job_position exists
		const jobPosition = await this._jobPositions.getById(employeeData.jobPosition);
		if (!jobPosition) {
			throw new ValidationError('Invalid jobPosition');
		}

		// Check if cinema exists
		const cinema = await this._cinemas.getById(employeeData.cinema);
		if (!cinema) {
			throw new ValidationError('Invalid cinema');
		}

		// Check if person exists by document_number
		let person = await this._people.getOne({ document_number: employeeData.documentNumber });
		if (!person) {
			// Create person
			const personData = {
				document_number: employeeData.documentNumber,
				first_name: employeeData.firstName,
				last_name: employeeData.lastName,
				gender: employeeData.gender,
				phone_number: employeeData.phoneNumber,
				personal_email: employeeData.email,
				birth_date: employeeData.birthDate,
			};
			person = await this._people.create(personData);
		}

		// Create employee
		const employee = await this._employees.create({
			person: person.id,
			employee_code: employeeData.employeeCode,
		});

		// Create employee position
		await this._employeePositions.create({
			employee: employee.id,
			job_position: employeeData.jobPosition,
			cinema: employeeData.cinema,
			start_date: employeeData.startDate,
			end_date: employeeData.endDate,
			salary_base: employeeData.salaryBase,
		});

		return employee;
	}

	async updateEmployee(id: number, employeeData: any) {
		const employee = await this._employees.getById(id);
		if (!employee) throw new NotFoundError('Employee', id);

		const updateData: Record<string, any> = {};

		if (employeeData.employeeCode !== undefined) {
			if (!employeeData.employeeCode) {
				throw new ValidationError('employeeCode cannot be empty');
			}
			updateData.employee_code = employeeData.employeeCode;
		}

		return this._employees.update(id, updateData);
	}

	async deleteEmployee(id: number) {
		const employee = await this._employees.getById(id);
		if (!employee) throw new NotFoundError('Employee', id);
		return this._employees.delete(id);
	}

	async changeEmployeePosition(employeeId: number, positionData: any) {
		// Validate required fields
		if (!positionData.jobPosition) {
			throw new ValidationError('jobPosition is required');
		}
		if (!positionData.cinema) {
			throw new ValidationError('cinema is required');
		}
		if (!positionData.startDate) {
			throw new ValidationError('startDate is required');
		}

		// Check if employee exists
		const employee = await this._employees.getById(employeeId);
		if (!employee) {
			throw new NotFoundError('Employee', employeeId);
		}

		// Check if job_position exists
		const jobPosition = await this._jobPositions.getById(positionData.jobPosition);
		if (!jobPosition) {
			throw new ValidationError('Invalid jobPosition');
		}

		// Check if cinema exists
		const cinema = await this._cinemas.getById(positionData.cinema);
		if (!cinema) {
			throw new ValidationError('Invalid cinema');
		}

		// End current position if exists
		const currentPositionsResult = await this._employeePositions.getAll(
			{ count: false },
			{
				employee: employeeId,
			},
		);

		const currentPositions = Array.isArray(currentPositionsResult)
			? currentPositionsResult
			: (currentPositionsResult?.rows ?? []);

		for (const pos of currentPositions) {
			await this._employeePositions.update(pos.id, { end_date: new Date() });
		}

		// Create new position
		const newPosition = await this._employeePositions.create({
			employee: employeeId,
			job_position: positionData.jobPosition,
			cinema: positionData.cinema,
			start_date: positionData.startDate,
			end_date: positionData.endDate,
			salary_base: positionData.salaryBase,
		});

		return newPosition;
	}
}

export default new EmployeesService();
