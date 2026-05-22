import { Database } from '@database/index.js';
import { ValidationError, NotFoundError, ConflictError } from '@errors';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { REGEX } from '@constants/regex.constant.js';
import { Transaction } from 'sequelize';

export class EmployeeManagementService {
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

    async findAllEmployees(cinemaId?: number, filters?: any) {
        const positionFilter: any = { end_date: null };
        if (cinemaId) positionFilter.cinema = cinemaId;

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
                    attributes: ['id', 'job_position', 'cinema', 'start_date', 'end_date', 'salary_base'],
                    required: !!cinemaId,
                    where: positionFilter,
                    include: [
                        { association: '_JobPositions', attributes: ['id', 'title'] },
                        { association: '_Cinemas', attributes: ['id', 'name'] },
                    ],
                },
            ],
        };

        return this._employees.getAll({ ...queryOptions, ...filters });
    }

    async createEmployee(employeeData: any, cinemaId: number) {
        if (!employeeData.documentNumber?.trim()) throw new ValidationError('El número de documento es obligatorio');
        if (!employeeData.firstName?.trim()) throw new ValidationError('El nombre es obligatorio');
        if (!employeeData.lastName?.trim()) throw new ValidationError('El apellido es obligatorio');
        if (!employeeData.employeeCode?.trim()) throw new ValidationError('El código de empleado es obligatorio');
        if (!employeeData.jobPosition) throw new ValidationError('El cargo es obligatorio');
        if (!employeeData.startDate) throw new ValidationError('La fecha de inicio es obligatoria');

        const jobPosition = await this._jobPositions.getById(employeeData.jobPosition);
        if (!jobPosition) throw new ValidationError('El cargo especificado no existe');

        const cinema = await this._cinemas.getById(cinemaId);
        if (!cinema) throw new ValidationError('La sucursal indicada no existe');

        if (employeeData.email && employeeData.password) {
            if (!REGEX.PASSWORD.test(employeeData.password)) {
                throw new ValidationError(
                    'La contraseña debe tener entre 8 y 20 caracteres, al menos una letra, un número y un símbolo especial',
                );
            }
        }

        const result = await this._people.transaction(async (transaction: Transaction) => {
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

            const employee = await this._employees.create(
                {
                    person: person.id,
                    employee_code: employeeData.employeeCode,
                },
                { transaction },
            );

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
                            role: employeeData.role ?? null,
                        },
                        { transaction },
                    );
                }
            }

            return employee;
        });

        return result;
    }

    async findEmployeeById(id: number, cinemaId?: number) {
        const employee = await this._employees.getById(id, {
            relations: [
                { association: '_People', attributes: ['id', 'document_number', 'first_name', 'last_name'] },
                { association: '_EmployeePositions', attributes: ['id', 'cinema', 'end_date'] },
            ],
        });
        if (!employee) throw new NotFoundError('Empleado no encontrado');

        if (cinemaId) {
            const position = await this._employeePositions.getOne({ employee: id, cinema: cinemaId, end_date: null });
            if (!position)
                throw new NotFoundError('El empleado no está asignado a esta sucursal o no tiene un cargo activo');
        }

        return employee;
    }

    async deleteEmployee(id: number) {
        await this._employees.transaction(async (transaction: Transaction) => {
            const employee = await this._employees.getById(id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!employee) throw new NotFoundError('Empleado no encontrado');

            const activePosition = await this._employeePositions.getOne(
                { employee: id, end_date: null },
                { transaction, lock: transaction.LOCK.UPDATE },
            );
            if (activePosition) {
                await this._employeePositions.update(activePosition.id, { end_date: new Date() }, { transaction });
            }

            await this._employees.delete(id, { transaction });

            if (employee.person) {
                const user = await this._users.getOne(
                    { person: employee.person },
                    { transaction, lock: transaction.LOCK.UPDATE },
                );
                if (user) {
                    await this._users.delete(user.id, { transaction });
                }
            }
        });
    }
}

export default new EmployeeManagementService();
