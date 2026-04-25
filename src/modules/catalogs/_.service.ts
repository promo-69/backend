import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError } from '@errors/validation.error.js';
import { DatabaseError } from '@errors/database.error.js';
import { type ProcessedQueryFilters } from '@rules/api-query.type.js';
import { type ModelWithAssociate } from '@database/models/bases/sequelize.model.js';
import { type SequelizeRepositoryBase } from '@database/repositories/bases/sequelize.repository.js';

class BasicTablesService extends BaseService {
    private catalogsSchema: Map<string, any> = new Map();
    private catalogRepoNames: Map<string, string> = new Map();

    constructor() {
        super();
        this.initializeCache();
    }

    private initializeCache(): void {
        const models = Database.getDefaultConnector().getModels<ModelWithAssociate>();
        
        for (const [modelName, model] of models.entries()) {
            if (model.isBasicTable) {
                const schema = this.extractSchema(model);
                const catalogName = model.appRawName || modelName;
                
                this.catalogsSchema.set(catalogName, {
                    modelName,
                    schema,
                    associations: model.associations
                });

                const repoName = model.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                this.catalogRepoNames.set(catalogName, repoName);
            }
        }
    }

    private extractSchema(model: ModelWithAssociate): Record<string, any> {
        const rawAttributes = model.getAttributes ? model.getAttributes() : (model as any).rawAttributes;
        const schema: Record<string, any> = {};

        for (const [key, attr] of Object.entries(rawAttributes)) {
            const typedAttr = attr as any;
            const enhancedData = typedAttr.enhancedData || {};
            const uiLabel = enhancedData.uiLabel || key;
            const visible = enhancedData.visible !== false;
            const editable = enhancedData.editable !== false;
            const isRequired = typedAttr.allowNull === false;
            
            let type = 'string';
            if (typedAttr.type) {
                const attrType = typedAttr.type.constructor.name.toLowerCase();
                if (attrType.includes('integer') || attrType.includes('bigint')) type = 'integer';
                else if (attrType.includes('decimal') || attrType.includes('float') || attrType.includes('real')) type = 'decimal';
                else if (attrType.includes('date') || attrType.includes('time')) type = 'date';
                else if (attrType.includes('boolean')) type = 'boolean';
            }

            const fieldSchema: any = {
                uiLabel,
                visible,
                editable,
                isRequired,
                type,
            };

            if (typedAttr.references) {
                fieldSchema.reference = typeof typedAttr.references === 'string' 
                    ? typedAttr.references 
                    : typedAttr.references.model;
            }

            schema[key] = fieldSchema;
        }

        return schema;
    }

    public getCatalogMetadata(catalogName: string): Record<string, any> {
        const catalog = this.catalogsSchema.get(catalogName);
        if (!catalog) throw new ValidationError(`Catalog ${catalogName} not found`);
        return catalog.schema;
    }

    private getRepository(catalogName: string): SequelizeRepositoryBase<any, any> {
        const repoName = this.catalogRepoNames.get(catalogName);
        if (!repoName) throw new ValidationError(`Catalog ${catalogName} not found`);
        return Database.repository('main', repoName) as SequelizeRepositoryBase<any, any>;
    }

    private getModelAssociations(catalogName: string): Record<string, any> | undefined {
        const catalog = this.catalogsSchema.get(catalogName);
        if (!catalog) throw new ValidationError(`Catalog ${catalogName} not found`);
        return catalog.associations;
    }

    private buildRelations(catalogName: string, include?: boolean): any[] | undefined {
        if (!include) return undefined;
        const associations = this.getModelAssociations(catalogName);
        if (!associations) return undefined;

        const relations: any[] = [];
        for (const [alias, assoc] of Object.entries(associations)) {
            const targetModel = (assoc as any).target;
            const attributes = [targetModel.primaryKeyAttribute];
            
            const rawAttrs = targetModel.getAttributes ? targetModel.getAttributes() : targetModel.rawAttributes;
            if (rawAttrs['name']) attributes.push('name');
            if (rawAttrs['description']) attributes.push('description');

            relations.push({
                association: alias,
                attributes,
                required: false,
            });
        }
        return relations;
    }

    private getVisibleAttributes(catalogName: string): string[] {
        const schema = this.getCatalogMetadata(catalogName);
        return Object.entries(schema)
            .filter(([_, field]: [string, any]) => field.visible)
            .map(([key]) => key);
    }

    private sanitizeBody(catalogName: string, body: Record<string, any>, isUpdate: boolean = false): Record<string, any> {
        const schema = this.getCatalogMetadata(catalogName);
        const cleanBody: Record<string, any> = {};
        const missingFields: string[] = [];

        for (const [key, field] of Object.entries(schema)) {
            const f = field as any;
            if (f.editable && body[key] !== undefined) {
                cleanBody[key] = body[key];
            } else if (!isUpdate && f.isRequired && f.editable) {
                missingFields.push(key);
            }
        }

        if (missingFields.length > 0) {
            throw new ValidationError('Missing required fields', { missingFields } as any);
        }

        return cleanBody;
    }

    private handleError(error: unknown): never {
        if (error instanceof DatabaseError) {
            throw new ValidationError(error.message, { cause: error } as any);
        }
        throw error as Error;
    }

    public async list(catalogName: string, filters: ProcessedQueryFilters, include: boolean): Promise<any> {
        const repo = this.getRepository(catalogName);
        const relations = this.buildRelations(catalogName, include);
        const attributes = this.getVisibleAttributes(catalogName);

        const options = {
            ...filters,
            relations,
            attributes
        };

        try {
            return await repo.getAllActive(options as any, filters.qc);
        } catch (error) {
            this.handleError(error);
        }
    }

    public async getById(catalogName: string, id: string | number, include: boolean): Promise<any> {
        const repo = this.getRepository(catalogName);
        const relations = this.buildRelations(catalogName, include);
        const attributes = this.getVisibleAttributes(catalogName);

        try {
            return await repo.getById(id, { relations, attributes } as any);
        } catch (error) {
            this.handleError(error);
        }
    }

    public async create(catalogName: string, body: Record<string, any>): Promise<any> {
        const cleanBody = this.sanitizeBody(catalogName, body, false);
        const repo = this.getRepository(catalogName);

        try {
            return await repo.create(cleanBody);
        } catch (error) {
            this.handleError(error);
        }
    }

    public async update(catalogName: string, id: string | number, body: Record<string, any>): Promise<any> {
        const cleanBody = this.sanitizeBody(catalogName, body, true);
        const repo = this.getRepository(catalogName);

        try {
            await repo.update(id, cleanBody);
            return await repo.getById(id);
        } catch (error) {
            this.handleError(error);
        }
    }

    public async remove(catalogName: string, id: string | number): Promise<boolean> {
        const repo = this.getRepository(catalogName);

        try {
            await repo.delete(id);
            return true;
        } catch (error) {
            this.handleError(error);
        }
    }
}

export default new BasicTablesService();
