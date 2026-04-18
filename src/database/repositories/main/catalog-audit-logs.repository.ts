import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CatalogAuditLogsModel from '@database/models/main/catalog-audit-logs.model.js';

export interface CatalogAuditLogsAttributes {
    id?: number;
    table_name: string;
    record_id: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    changed_by?: number | null;
    previous_data?: object | null;
    new_data?: object | null;
    created_at?: Date | string;
}

class CatalogAuditLogsRepository extends SequelizeRepositoryBase<CatalogAuditLogsAttributes, number> {
    constructor() {
        super(CatalogAuditLogsModel);
    }

    async getByTableAndRecord(tableName: string, recordId: number, filters?: any) {
        return this.getAll({ ...filters, count: true }, { table_name: tableName, record_id: recordId });
    }
}

export default new CatalogAuditLogsRepository();
