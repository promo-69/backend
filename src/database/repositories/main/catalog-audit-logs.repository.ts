import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import CatalogAuditLogsModel from '@database/models/main/catalog-audit-logs.model.js';

export interface CatalogAuditLogsAttributes {
	id?: number;
	table_name: string;
	record_id: number;
	action: string;
	changed_by?: number;
	previous_data?: any;
	new_data?: any;
	created_at: Date;
}

class CatalogAuditLogsRepository extends SequelizeRepositoryBase<CatalogAuditLogsAttributes, number> {
	constructor() {
		super(CatalogAuditLogsModel);
	}
}

export default new CatalogAuditLogsRepository();
