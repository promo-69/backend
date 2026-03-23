import { SequelizeRepositoryBase, type RelationConfig } from '@repositories/bases/sequelize.repository.js';
import PeopleModel from '@database/models/main/people.model.js';

export interface PeopleAttributes {
    id?: number;
    document_number: string;
    first_name: string;
    last_name: string;
    gender?: number;
    phone_number?: string;
    email?: string;
    birth_date?: Date | string;
    status: number;
}

class PeopleRepository extends SequelizeRepositoryBase<PeopleAttributes, number> {
    constructor() {
        super(PeopleModel);
    }

    async getByDocumentNumber({ document_number }: { document_number?: string } = {}): Promise<PeopleAttributes | null> {
        const relations: RelationConfig[] = [
            { association: '_Gender', attributes: ['genderDesc'] },
        ];

        return this.getOne({ document_number }, { relations });
    }
}

export default new PeopleRepository();
