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

    private _formatEmployeeResponse(raw: any) {
        if (!raw) return null;

        const { _People: people, _EmployeePositions: positions, deleted_at, person, ...employeeFields } = raw;

        return {
            // Datos biográficos de la persona (el "padre")
            person: people
                ? {
                      id: people.id,
                      document_number: people.document_number,
                      first_name: people.first_name,
                      last_name: people.last_name,
                      gender: people.gender ?? null,
                      phone_number: people.phone_number ?? null,
                      personal_email: people.personal_email ?? null,
                      birth_date: people.birth_date ?? null,
                  }
                : null,

            // Datos propios del registro en employees
            employee: {
                ...employeeFields,
                // Historial de cargos anidado en employee
                positions: (positions ?? []).map((pos: any) => ({
                    id: pos.id,
                    start_date: pos.start_date,
                    end_date: pos.end_date ?? null,
                    salary_base: pos.salary_base ?? null,
                    is_active: pos.end_date === null,
                    job_position: pos._JobPositions
                        ? { id: pos._JobPositions.id, name: pos._JobPositions.title }
                        : { id: pos.job_position },
                    cinema: pos._Cinemas ? { id: pos._Cinemas.id, name: pos._Cinemas.name } : { id: pos.cinema },
                })),
            },

            // Registro de usuario (puede ser null si no tiene credenciales)
            user: null as any, // se completa en _attachUser
        };
    }

    /* Adjunta el usuario asociado a la persona del empleado */
    private async _attachUser(formatted: any, personId: number) {
        if (!formatted) return null;
        try {
            const user = await this._users.getOne({ person: personId });
            formatted.user = user
                ? {
                      id: user.id,
                      email: user.email,
                      user_type: user.user_type,
                      status: user.status,
                      signup_verified_at: user.signup_verified_at ?? null,
                  }
                : null;
        } catch {
            formatted.user = null;
        }
        return formatted;
    }

    /* Lista empleados de la sucursal del usuario (contexto implícito).
     * required: true → INNER JOIN → solo empleados con cargo activo en esa sede. */
    async findAllEmployees(cinemaId?: number, filters?: any) {
        const positionFilter: any = { end_date: null };
        if (cinemaId) positionFilter.cinema = cinemaId;

        const queryOptions = {
            count: true,
            attributes: ['id', 'person', 'cinema', 'hire_date', 'employee_code'],
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
                    attributes: ['id', 'job_position', 'cinema', 'start_date', 'end_date'],
                    required: !!cinemaId,
                    where: positionFilter,
                    include: [{ association: '_JobPositions', attributes: ['id', 'name'] }],
                },
            ],
        };

        const result = await this._employees.getAll({ ...queryOptions, ...filters });

        const formatAndAttach = async (emp: any) => {
            const formatted = this._formatEmployeeResponse(emp);
            return this._attachUser(formatted, emp.person);
        };

        if (Array.isArray(result)) {
            return Promise.all(result.map(formatAndAttach));
        }

        return {
            ...result,
            rows: await Promise.all(result.rows.map(formatAndAttach)),
        };
    }

    /* Detalle de un empleado con historial completo de cargos.
     * Solo accesible si tiene un cargo ACTIVO en la sucursal del solicitante. */
    async findEmployeeById(id: number, cinemaId?: number) {
        const raw = await this._employees.getFull(id);
        if (!raw) throw new NotFoundError('Empleado no encontrado');

        if (cinemaId) {
            const positions = raw._EmployeePositions ?? [];
            const belongsToCinema = positions.some((pos: any) => pos.cinema === cinemaId && pos.end_date === null);
            if (!belongsToCinema) throw new NotFoundError('Empleado no encontrado en esta sucursal');
        }

        const formatted = this._formatEmployeeResponse(raw);
        return this._attachUser(formatted, raw.person);
    }

    /* Contratación local (contexto implícito) o explícita (SUPER_ADMIN).
     * Transacción atómica: people → employees → employee_positions → (opcional) users. */
    async createEmployee(employeeData: any, session: any) {
        let cinemaId: number;
        if (session.cinemaId) {
            cinemaId = session.cinemaId;
        } else if (employeeData.cinema) {
            cinemaId = employeeData.cinema;
        } else {
            throw new ValidationError(
                'No se pudo determinar la sucursal. Especifica "cinema" en el body o inicia sesión con una sucursal asignada.',
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

        const jobPosition = await this._jobPositions.getById(employeeData.jobPosition);
        if (!jobPosition) throw new ValidationError('Cargo laboral inválido');

        const cinema = await this._cinemas.getById(cinemaId);
        if (!cinema) throw new ValidationError('Sucursal inválida');

        if (employeeData.email && employeeData.password) {
            if (!REGEX.PASSWORD.test(employeeData.password)) {
                throw new ValidationError(
                    'La contraseña debe tener entre 8 y 20 caracteres, al menos una letra, un número y un símbolo',
                    ['password'],
                );
            }
        }

        const result = await this._people.transaction(async (transaction: Transaction) => {
            // 1. Buscar o crear persona
            let person = await this._people.getOne({ document_number: employeeData.documentNumber });
            if (!person) {
                person = await this._people.create(
                    {
                        document_number: employeeData.documentNumber,
                        first_name: employeeData.firstName,
                        last_name: employeeData.lastName,
                        gender: employeeData.gender ?? null,
                        phone_number: employeeData.phoneNumber ?? null,
                        personal_email: employeeData.email ?? null,
                        birth_date: employeeData.birthDate ?? null,
                    },
                    { transaction },
                );
            }

            // 2. Crear empleado
            const employee = await this._employees.create(
                {
                    person: person.id,
                    cinema: cinemaId,
                    hire_date: employeeData.startDate ?? new Date(),
                    employee_code: employeeData.employeeCode,
                },
                { transaction },
            );

            // 3. Crear cargo activo
            await this._employeePositions.create(
                {
                    employee: employee.id,
                    job_position: employeeData.jobPosition,
                    cinema: cinemaId,
                    start_date: employeeData.startDate,
                    end_date: employeeData.endDate ?? null,
                    salary_base: employeeData.salaryBase ?? null,
                },
                { transaction },
            );

            // 4. Crear usuario si se envían credenciales
            if (employeeData.email && employeeData.password) {
                const existingUser = await this._users.getOne({ person: person.id });
                if (!existingUser) {
                    const hashedPassword = await BcryptUtil.hash(employeeData.password);
                    await this._users.create(
                        {
                            person: person.id,
                            email: employeeData.email,
                            password: hashedPassword,
                            user_type: 1,
                            status: 1,
                        },
                        { transaction },
                    );
                }
            }

            return employee;
        });

        const raw = await this._employees.getFull(result.id);
        const formatted = this._formatEmployeeResponse(raw);
        return this._attachUser(formatted, raw.person);
    }

    /* PATCH /employees/:id — actualiza datos biográficos y/o employee_code.
     * Concurrencia: adquiere LOCK sobre employees antes de modificar. */
    async updateEmployee(id: number, employeeData: any) {
        await this._employees.transaction(async (transaction: Transaction) => {
            // Lock sobre el registro del empleado para evitar actualizaciones simultáneas
            const employee = await this._employees.getById(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!employee) throw new NotFoundError('Empleado no encontrado');

            const peopleUpdate: Record<string, any> = {};
            if (employeeData.firstName !== undefined) peopleUpdate.first_name = employeeData.firstName;
            if (employeeData.lastName !== undefined) peopleUpdate.last_name = employeeData.lastName;
            if (employeeData.phoneNumber !== undefined) peopleUpdate.phone_number = employeeData.phoneNumber;
            if (employeeData.email !== undefined) peopleUpdate.personal_email = employeeData.email;
            if (employeeData.birthDate !== undefined) peopleUpdate.birth_date = employeeData.birthDate;
            if (employeeData.gender !== undefined) peopleUpdate.gender = employeeData.gender;

            if (Object.keys(peopleUpdate).length > 0) {
                // Lock sobre el registro de people también
                const person = await this._people.getById(employee.person, {
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });
                if (!person) throw new NotFoundError('Registro de persona no encontrado');
                await this._people.update(employee.person, peopleUpdate, { transaction });
            }

            if (employeeData.employeeCode !== undefined) {
                if (!employeeData.employeeCode) throw new ValidationError('employeeCode no puede estar vacío');
                await this._employees.update(id, { employee_code: employeeData.employeeCode }, { transaction });
            }

            if (Object.keys(peopleUpdate).length === 0 && employeeData.employeeCode === undefined) {
                throw new ValidationError('No se proporcionaron campos para actualizar');
            }
        });

        return null;
    }

    /* PATCH /employees/:id/position — SCD Tipo 2.
     * Concurrencia: lock sobre el cargo activo antes de cerrarlo. */
    async changeEmployeePosition(employeeId: number, positionData: any) {
        this.validateRequired(positionData, ['jobPosition', 'cinema', 'startDate']);

        const jobPosition = await this._jobPositions.getById(positionData.jobPosition);
        if (!jobPosition) throw new ValidationError('Cargo laboral inválido');

        const cinema = await this._cinemas.getById(positionData.cinema);
        if (!cinema) throw new ValidationError('Sucursal inválida');

        const newPosition = await this._employeePositions.transaction(async (transaction: Transaction) => {
            // Verificar que el empleado existe con lock
            const employee = await this._employees.getById(employeeId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!employee) throw new NotFoundError('Empleado no encontrado');

            // Buscar y lockear el cargo activo (end_date IS NULL)
            const activePositionsResult = await this._employeePositions.getAll(
                {
                    count: false,
                    operation: { transaction, lock: transaction.LOCK.UPDATE },
                },
                { employee: employeeId, end_date: null },
            );
            const activePosition = Array.isArray(activePositionsResult)
                ? activePositionsResult[0]
                : activePositionsResult?.rows?.[0];

            if (!activePosition) throw new ValidationError('El empleado no tiene un cargo activo');

            // Cerrar solo el registro activo
            await this._employeePositions.update(activePosition.id, { end_date: new Date() }, { transaction });

            // Crear nuevo cargo
            const created = await this._employeePositions.create(
                {
                    employee: employeeId,
                    job_position: positionData.jobPosition,
                    cinema: positionData.cinema,
                    start_date: positionData.startDate,
                    end_date: positionData.endDate ?? null,
                    salary_base: positionData.salaryBase ?? null,
                },
                { transaction },
            );

            return created;
        });

        return newPosition;
    }

    /* DELETE /employees/:id — cierra cargo activo, soft-delete, desactiva usuario.
     * Concurrencia: lock sobre employees y sobre el cargo activo. */
    async deleteEmployee(id: number) {
        await this._employees.transaction(async (transaction: Transaction) => {
            // Lock sobre el registro del empleado
            const employee = await this._employees.getById(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!employee) throw new NotFoundError('Empleado no encontrado');

            // Buscar y lockear el cargo activo
            const activePositionsResult = await this._employeePositions.getAll(
                {
                    count: false,
                    operation: { transaction, lock: transaction.LOCK.UPDATE },
                },
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

            // Desactivar usuario si existe, con lock
            if (employee.person) {
                const user = await this._users.getOne(
                    { person: employee.person },
                    { transaction, lock: transaction.LOCK.UPDATE },
                );
                if (user) {
                    await this._users.update(user.id, { status: 0 }, { transaction });
                }
            }
        });

        return null;
    }
}

export default new EmployeesService();
