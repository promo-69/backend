import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import ModifierScopesModel from '@database/models/main/modifier-scopes.model.js';

export interface ModifierScopesAttributes {
    id?: number;
    description: string;
    deleted_at?: Date;
}

class ModifierScopesRepository extends SequelizeRepositoryBase<ModifierScopesAttributes, number> {
    constructor() {
        super(ModifierScopesModel);
    }
}

export default new ModifierScopesRepository();
