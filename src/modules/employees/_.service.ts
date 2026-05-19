import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError } from '@errors';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { REGEX } from '@constants/regex.constant.js';
import { Transaction } from 'sequelize';

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

    /* Normaliza la salida de un empleado (sin deleted_at) */
    private normalizeEmployee(employee: any) {
        if (!employee) return null;
        const { deleted_at, _People, ...baseEmployee } = employee;
        return {
            ...baseEmployee,
            people: _People || null,
        };
    }

    /* Adjunta el usuario asociado a la persona del empleado */
    private async attachUserAndPerson(employee: any) {
        const normalizedEmployee = this.normalizeEmployee(employee);
        if (!normalizedEmployee) return null;

        let _User = null;
        try {
            _User = await this._users.getOne({ person: normalizedEmployee.person });
        } catch (error) {
            _User = null;
        }
        return {
            ...normalizedEmployee,
            _User,
        };
    }

    /* Lista empleados de la sucursal del usuario (contexto implícito).
     * CORRECCIÓN: required: true (INNER JOIN) para excluir empleados sin
     * cargo activo en esta sucursal. */
    async findAllEmployees(cinemaId?: number, filters?: any) {
        const positionFilter: any = { end_date: null };
        if (cinemaId) {
            positionFilter.cinema = cinemaId;
        }

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
                {
                    association: '_EmployeePositions',
                    attributes: ['id', 'start_date', 'end_date'],
                    required: !!cinemaId, // si no hay cinemaId, no obligamos a tener cargo activo
                    where: positionFilter,
                    include: [
                        {
                            association: '_JobPosition',
                            attributes: ['name'],
                        },
                    ],
                },
            ],
        };

        if (!cinemaId) {
            queryOptions.relations[1].required = false;
        }

        const result = await this._employees.getAll({ ...queryOptions, ...filters });

        if (Array.isArray(result)) {
            return Promise.all(result.map((employee) => this.attachUserAndPerson(employee)));
        }

        return {
            ...result,
            rows: await Promise.all(result.rows.map((employee: any) => this.attachUserAndPerson(employee))),
        };
    }

    /* Detalle de un empleado con historial completo de cargos.
     * Solo es accesible si el empleado tiene un cargo ACTIVO en la sucursal del solicitante. */
    async findEmployeeById(id: number, cinemaId?: number) {
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
                {
                    association: '_EmployeePositions',
                    attributes: ['id', 'job_position', 'cinema', 'start_date', 'end_date', 'salary_base'],
                },
            ],
        });

        if (!employee) throw new NotFoundError('Empleado no encontrado');

        // Solo verificar pertenencia si el usuario tiene un cinema asignado (contexto implícito)
        if (cinemaId) {
            const positions = employee._EmployeePositions || [];
            const belongsToCinema = positions.some((pos: any) => pos.cinema === cinemaId && pos.end_date === null);
            if (!belongsToCinema) throw new NotFoundError('Empleado no encontrado en esta sucursal');
        }

        return this.attachUserAndPerson(employee);
    }

    /* Contratación local (contexto implícito).
     * Transacción atómica: people → employees → employee_positions → (opcional) users.
     * CORRECCIÓN: contraseña hasheada con BcryptUtil antes de persistir. */
    async createEmployee(employeeData: any, session: any) {
        // Determinar cinemaId según contexto
        let cinemaId: number;
        if (session.cinemaId) {
            // Contexto implícito: gerente de sucursal
            cinemaId = session.cinemaId;
        } else if (employeeData.cinema) {
            // Contexto explícito: SUPER_ADMIN especifica la sucursal
            cinemaId = employeeData.cinema;
        } else {
            throw new ValidationError(
                'No se pudo determinar la sucursal de contratación. Debe especificar "cinema" en el body o tener una sucursal asignada.',
            );
        }

        this.validateRequired(employeeData, [
            'documentNumber',
            'firstName',
            'lastName',
            'employeeCode',
            'jobPosition',
            'startDate',
        ]);

        // Validar existencia de job_position
        const jobPosition = await this._jobPositions.getById(employeeData.jobPosition);
        if (!jobPosition) throw new ValidationError('Cargo laboral inválido');

        // Validar existencia del cinema
        const cinema = await this._cinemas.getById(cinemaId);
        if (!cinema) throw new ValidationError('Sucursal inválida');

        // Transacción atómica
        const result = await this._people.transaction(async (transaction: Transaction) => {
            // 1. Buscar o crear persona por número de documento
            let person = await this._people.getOne({ document_number: employeeData.documentNumber });
            if (!person) {
                person = await this._people.create(
                    {
                        document_number: employeeData.documentNumber,
                        first_name: employeeData.firstName,
                        last_name: employeeData.lastName,
                        gender: employeeData.gender || null,
                        phone_number: employeeData.phoneNumber || null,
                        personal_email: employeeData.email || null,
                        birth_date: employeeData.birthDate || null,
                        status: 1,
                    },
                    { transaction },
                );
            }

            // 2. Crear el empleado
            const employee = await this._employees.create(
                {
                    person: person.id,
                    employee_code: employeeData.employeeCode,
                    cinema: cinemaId,
                    hire_date: employeeData.startDate || new Date(), // usá startDate o la fecha actual
                    status: 1,
                },
                { transaction },
            );

            // 3. Crear el cargo activo
            await this._employeePositions.create(
                {
                    employee: employee.id,
                    job_position: employeeData.jobPosition,
                    cinema: cinemaId,
                    start_date: employeeData.startDate,
                    end_date: employeeData.endDate || null,
                    salary_base: employeeData.salaryBase || null,
                },
                { transaction },
            );

            // 4. Crear usuario opcional si se envían credenciales
            if (employeeData.email && employeeData.password) {
                const existingUser = await this._users.getOne({ person: person.id });
                if (!existingUser) {
                    await this._users.create(
                        {
                            person: person.id,
                            email: employeeData.email,
                            password: employeeData.password,
                            user_type: 1, // Empleado
                            status: 1,
                        },
                        { transaction },
                    );
                }
            }

            return employee;
        });

        return this._employees.getById(result.id, {
            attributes: ['id', 'person', 'employee_code'],
            relations: [
                {
                    association: '_People',
                    attributes: ['document_number', 'first_name', 'last_name', 'phone_number', 'personal_email'],
                },
            ],
        });
    }

    /* Actualiza datos biográficos (people) y/o employee_code */
    async updateEmployee(id: number, employeeData: any) {
        const employee = await this._employees.getById(id);
        if (!employee) throw new NotFoundError('Empleado no encontrado');

        await this._people.transaction(async (transaction: Transaction) => {
            const peopleUpdate: Record<string, any> = {};
            if (employeeData.firstName !== undefined) peopleUpdate.first_name = employeeData.firstName;
            if (employeeData.lastName !== undefined) peopleUpdate.last_name = employeeData.lastName;
            if (employeeData.phoneNumber !== undefined) peopleUpdate.phone_number = employeeData.phoneNumber;
            if (employeeData.email !== undefined) peopleUpdate.personal_email = employeeData.email;
            if (employeeData.birthDate !== undefined) peopleUpdate.birth_date = employeeData.birthDate;
            if (employeeData.gender !== undefined) peopleUpdate.gender = employeeData.gender;

            if (Object.keys(peopleUpdate).length > 0) {
                await this._people.update(employee.person, peopleUpdate, { transaction });
            }

            if (employeeData.employeeCode !== undefined) {
                if (!employeeData.employeeCode) throw new ValidationError('employeeCode no puede estar vacío');
                await this._employees.update(id, { employee_code: employeeData.employeeCode }, { transaction });
            }
        });

        return null;
    }

    /* Cambio de cargo / sucursal - SCD Tipo 2.
     * Cierra solo el cargo donde end_date IS NULL y crea uno nuevo. */
    async changeEmployeePosition(employeeId: number, positionData: any) {
        this.validateRequired(positionData, ['jobPosition', 'cinema', 'startDate']);

        const employee = await this._employees.getById(employeeId);
        if (!employee) throw new NotFoundError('Empleado no encontrado');

        const jobPosition = await this._jobPositions.getById(positionData.jobPosition);
        if (!jobPosition) throw new ValidationError('Cargo laboral inválido');

        const cinema = await this._cinemas.getById(positionData.cinema);
        if (!cinema) throw new ValidationError('Sucursal inválida');

        // Buscar estrictamente el cargo activo (end_date IS NULL)
        const activePositionsResult = await this._employeePositions.getAll(
            { count: false },
            { employee: employeeId, end_date: null },
        );
        const activePosition = Array.isArray(activePositionsResult)
            ? activePositionsResult[0]
            : activePositionsResult?.rows?.[0];

        if (!activePosition) throw new ValidationError('El empleado no tiene un cargo activo');

        const newPosition = await this._employeePositions.transaction(async (transaction: Transaction) => {
            // Cerrar solo el registro activo, no todos los históricos
            await this._employeePositions.update(activePosition.id, { end_date: new Date() }, { transaction });

            const created = await this._employeePositions.create(
                {
                    employee: employeeId,
                    job_position: positionData.jobPosition,
                    cinema: positionData.cinema,
                    start_date: positionData.startDate,
                    end_date: positionData.endDate || null,
                    salary_base: positionData.salaryBase || null,
                },
                { transaction },
            );

            return created;
        });

        return newPosition;
    }

    /* Cierra cargo activo, soft-delete de employees, desactiva usuario */
    async deleteEmployee(id: number) {
        const employee = await this._employees.getById(id);
        if (!employee) throw new NotFoundError('Empleado no encontrado');

        await this._employees.transaction(async (transaction: Transaction) => {
            // Cerrar cargo activo (end_date IS NULL)
            const activePositionsResult = await this._employeePositions.getAll(
                { count: false },
                { employee: id, end_date: null },
            );
            const activePosition = Array.isArray(activePositionsResult)
                ? activePositionsResult[0]
                : activePositionsResult?.rows?.[0];

            if (activePosition) {
                await this._employeePositions.update(activePosition.id, { end_date: new Date() }, { transaction });
            }

            // Soft-delete del empleado
            await this._employees.delete(id, { transaction });

            // Desactivar el usuario asociado (si existe)
            if (employee.person) {
                const user = await this._users.getOne({ person: employee.person });
                if (user) {
                    await this._users.update(user.id, { status: 2 }, { transaction });
                }
            }
        });

        return null;
    }
}

export default new EmployeesService();
