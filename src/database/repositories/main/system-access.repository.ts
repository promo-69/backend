import { SequelizeRepositoryBase, type RelationConfig } from '@repositories/bases/sequelize.repository.js';
import SystemAccessesModel from '@database/models/main/system-accesses.model.js';
import { type QueryResult } from '@bases/repository.base.js';

export interface SystemAccessesAttributes {
    id?: number;
    username: string;
    password: string;
    responsibleEmployee: number;
    registrationDate: Date | string;
    lastLoginDate: Date | string | null;
    status: number;
}

class SystemAccessesRepository extends SequelizeRepositoryBase<SystemAccessesAttributes, number> {
    constructor() {
        super(SystemAccessesModel);
    }

    async getAllFull(filters: any): Promise<QueryResult<SystemAccessesAttributes>> {
        const relations: RelationConfig[] = [
            { association: '_Employees', attributes: ['id', 'document_number', 'first_name', 'last_name'] },
            {
                association: '_UserRoles',
                required: false,
                attributes: ['id', 'role'],
                nested: [
                    {
                        association: '_Roles',
                        attributes: ['id', 'code', 'description'],
                    },
                ],
            },
        ];

        const queryOptions: any = { ...filters };
        delete queryOptions.queCon;

        return this.getAllActive({ ...queryOptions, relations, operation: { distinct: true } }, {});
    }

    async getFull(id: number): Promise<SystemAccessesAttributes | null> {
        this.validateId(id, true);

        const relations: RelationConfig[] = [
            { association: '_AdminUnit', attributes: ['id', 'description'] },
            { association: '_Employees', attributes: ['id', 'document_number', 'first_name', 'last_name'] },
            {
                association: '_UserRoles',
                attributes: ['id', 'role'],
                nested: [
                    {
                        association: '_Roles',
                        attributes: ['id', 'code', 'description'],
                    },
                ],
            },
        ];

        return this.getOne({ id }, { relations });
    }

    async getByUser({ username }: { username: string }): Promise<SystemAccessesAttributes | null> {
        return this.getOne(
            { username },
            { operation: { attributes: ['id'] } }
        );
    }

    async getByCredentials({ username, password }: { username: string; password: string }): Promise<SystemAccessesAttributes | null> {
        const relations: RelationConfig[] = [
            { association: '_Employees', attributes: ['document_number', 'first_name', 'last_name'] },
        ];

        return this.getOne(
            { username, password },
            {
                relations,
                operation: { attributes: ['id', 'username', 'responsibleEmployee'] }
            }
        );
    }
}

export default new SystemAccessesRepository();
