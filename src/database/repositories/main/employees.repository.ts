import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import EmployeesModel from '@database/models/main/employees.model.js';

export interface EmployeesAttributes {
    id?: number;
    person: number;
    employee_code: string;
    deleted_at?: Date;
}

class EmployeesRepository extends SequelizeRepositoryBase<EmployeesAttributes, number> {
    constructor() {
        super(EmployeesModel);
    }

    private get _fullRelations() {
        return [
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
                required: true,
            },
            {
                association: '_EmployeePositions',
                attributes: ['id', 'job_position', 'cinema', 'start_date', 'end_date', 'salary_base'],
                required: false,
                include: [
                    {
                        association: '_JobPositions',
                        attributes: ['id', 'title'],
                    },
                    {
                        association: '_Cinemas',
                        attributes: ['id', 'name'],
                    },
                ],
            },
        ];
    }

    async getFull(id: number) {
        return this.getById(id, {
            attributes: ['id', 'person', 'employee_code'],
            relations: this._fullRelations,
        });
    }
}

export default new EmployeesRepository();
