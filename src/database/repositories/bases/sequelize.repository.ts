import {
    Model,
    type WhereOptions,
    type FindOptions,
    type CreationAttributes,
    type ModelStatic,
    type Identifier,
    Transaction,
    type Includeable,
    type FindAndCountOptions,
    type DestroyOptions,
    type UpdateOptions,
    type CreateOptions,
    type CountOptions,
} from 'sequelize';
import {
    BaseRepository,
    type GetAllOptions,
    type WhereCondition,
    WhereOperators,
    type QueryResult,
} from '@bases/repository.base.js';
import { DatabaseError } from '@errors/database.error.js';
import { type ModelWithAssociate, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';
import { Op } from 'sequelize';

export interface RelationConfig {
    association: string;
    attributes?: string[];
    nested?: RelationConfig | RelationConfig[] | null;
    required?: boolean;
    where?: WhereCondition;
    separate?: boolean;
}

export interface OperationOptions {
    transaction?: Transaction | null;
    lock?: typeof Transaction.LOCK.UPDATE | typeof Transaction.LOCK.SHARE;
    skipLocked?: boolean;
    paranoid?: boolean;
    returning?: boolean;
    plain?: boolean;
    mapToModel?: boolean;
    raw?: boolean;

    [key: string]: any;
}
export interface EspecificQueryOptions {
    // Relaciones específicas de Sequelize
    relations?: RelationConfig[];
    // Atributos específicos
    attributes?: string[];
}
export type SequelizeGetAllOptions = GetAllOptions & EspecificQueryOptions;
export type SequelizeOperationOptions = OperationOptions & EspecificQueryOptions;

export interface BulkCreateOptions extends OperationOptions {
    ignoreDuplicates?: boolean;
    ignoreFields?: (keyof any)[];
    updateOnDuplicate?: string[];
}

export type SequelizeModelClass = typeof SequelizeModelBase & {
    instance?: ModelWithAssociate;
};

export class SequelizeRepositoryBase<T = any, ID extends Identifier = string> extends BaseRepository<
    T,
    ID,
    ModelWithAssociate
> {
    protected override _model: ModelWithAssociate;

    constructor(modelClass: SequelizeModelClass) {
        if (!modelClass.instance) throw new Error(`Model ${modelClass.name} has not been initialized`);
        super(modelClass.instance);
        this._model = modelClass.instance;
    }

    protected translateWhereCondition(condition?: ID | ID[] | WhereCondition): any {
        if (!condition) return {};

        // Si es ID simple
        if (this.isIdentifier(condition)) {
            this.validateId(condition as ID, true);
            return { id: condition } as WhereOptions;
        }

        // Si es array de IDs
        if (this.isArrayOfIds(condition)) {
            (condition as ID[]).forEach((id) => this.validateId(id, true));
            return { id: condition } as WhereOptions;
        }

        // Traducir WhereCondition a WhereOptions de Sequelize
        return this.translateConditionToSequelize(condition as Exclude<WhereCondition, ID | ID[]>);
    }

    private translateConditionToSequelize(condition: WhereCondition): WhereOptions {
        // Si es condición compuesta (AND/OR) a nivel raíz
        if (WhereOperators.and in condition) {
            const andConditions = (condition as any)[WhereOperators.and] as WhereCondition[];
            return {
                [Op.and]: andConditions.map((c) => this.translateConditionToSequelize(c)),
            };
        }

        if (WhereOperators.or in condition) {
            const orConditions = (condition as any)[WhereOperators.or] as WhereCondition[];
            return {
                [Op.or]: orConditions.map((c) => this.translateConditionToSequelize(c)),
            };
        }

        const translated: WhereOptions = {};

        for (const [field, value] of Object.entries(condition as Record<string, unknown>)) {
            // Si el valor es un objeto que podría contener condiciones
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const symbols = Object.getOwnPropertySymbols(value);

                // Verificar si es una condición compuesta anidada en el campo
                if (symbols.includes(WhereOperators.and) || symbols.includes(WhereOperators.or)) {
                    const nestedResult = this.translateNestedFieldCondition(field, value);
                    if (nestedResult) Object.assign(translated, nestedResult);
                }
                // Es un objeto con operadores normales (eq, gt, etc.)
                else if (symbols.length > 0) {
                    const fieldConditions: any = {};
                    let hasOperators = false;

                    for (const symbol of symbols) {
                        const operatorValue = (value as any)[symbol];
                        const sequelizeOperator = this.mapSymbolToSequelizeOperator(symbol);

                        if (sequelizeOperator) {
                            const processedValue = this.processSimpleOperatorValue(symbol, operatorValue);
                            fieldConditions[sequelizeOperator] = processedValue;
                            hasOperators = true;
                        }
                    }

                    if (hasOperators) {
                        translated[field] = fieldConditions;
                    }
                }
                // Es un objeto normal sin symbols
                else if (Object.keys(value as object).length > 0) {
                    translated[field] = value;
                }
            }
            // Si es un array (podría ser para IN implícito u OR de valores simples)
            else if (Array.isArray(value)) {
                translated[field] = { [Op.in]: value };
            }
            // Valor simple
            else if (value !== undefined && value !== null) {
                translated[field] = value;
            }
        }

        return translated;
    }

    private translateNestedFieldCondition(field: string, condition: any): WhereOptions | null {
        const symbols = Object.getOwnPropertySymbols(condition);

        if (symbols.includes(WhereOperators.and)) {
            const andConditions = condition[WhereOperators.and] as WhereCondition[];
            const translatedConditions = andConditions.map((cond) => this.translateFieldValueCondition(field, cond));
            return { [Op.and]: translatedConditions };
        }

        if (symbols.includes(WhereOperators.or)) {
            const orConditions = condition[WhereOperators.or] as WhereCondition[];
            const translatedConditions = orConditions.map((cond) => this.translateFieldValueCondition(field, cond));
            return { [Op.or]: translatedConditions };
        }

        return null;
    }

    private translateFieldValueCondition(field: string, condition: WhereCondition): WhereOptions {
        // Si la condición es un objeto con operadores
        if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
            const symbols = Object.getOwnPropertySymbols(condition);

            if (symbols.length > 0) {
                const fieldConditions: any = {};

                for (const symbol of symbols) {
                    const operatorValue = (condition as any)[symbol];
                    const sequelizeOperator = this.mapSymbolToSequelizeOperator(symbol);

                    if (sequelizeOperator) {
                        const processedValue = this.processSimpleOperatorValue(symbol, operatorValue);
                        fieldConditions[sequelizeOperator] = processedValue;
                    }
                }

                return { [field]: fieldConditions };
            }
        }

        // Si es un valor simple (equals implícito)
        return { [field]: condition };
    }

    private processSimpleOperatorValue(symbol: Symbol, value: any): any {
        if (symbol === WhereOperators.contains && typeof value === 'string') {
            return `%${value}%`;
        }
        if (symbol === WhereOperators.startsWith && typeof value === 'string') {
            return `${value}%`;
        }
        if (symbol === WhereOperators.endsWith && typeof value === 'string') {
            return `%${value}`;
        }
        if (symbol === WhereOperators.isNull) {
            return null;
        }
        if (symbol === WhereOperators.isNotNull) {
            return { [Op.ne]: null };
        }
        return value;
    }

    private mapSymbolToSequelizeOperator(symbol: Symbol): any {
        const symbolMap = new Map<Symbol, any>([
            [WhereOperators.eq, Op.eq],
            [WhereOperators.ne, Op.ne],
            [WhereOperators.gt, Op.gt],
            [WhereOperators.gte, Op.gte],
            [WhereOperators.lt, Op.lt],
            [WhereOperators.lte, Op.lte],
            [WhereOperators.contains, Op.like],
            [WhereOperators.startsWith, Op.startsWith],
            [WhereOperators.endsWith, Op.endsWith],
            [WhereOperators.in, Op.in],
            [WhereOperators.notIn, Op.notIn],
            [WhereOperators.between, Op.between],
            [WhereOperators.isNull, Op.is],
            [WhereOperators.isNotNull, Op.not],
        ]);

        return symbolMap.get(symbol);
    }

    private isIdentifier(value: any): boolean {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') return true;
        return false;
    }

    private isArrayOfIds(value: any): value is ID[] {
        if (!Array.isArray(value)) return false;
        if (value.length === 0) return false;
        return value.every((item) => this.isIdentifier(item));
    }

    async create(data: Partial<T>, operationOptions?: OperationOptions): Promise<T> {
        return this.executeWithLogging('create', async () => {
            try {
                const creationData = data as CreationAttributes<Model>;
                const options: CreateOptions = {};

                this.applyOperationOptions(options, operationOptions);

                const result = await this._model.create(creationData, options);

                return result.toJSON() as T;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'create' operation failed`,
                    'create',
                    {
                        data,
                        database: this._model.dbInstanceName,
                        model: this._model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async bulkCreate(data: Partial<T>[], operationOptions?: BulkCreateOptions): Promise<T[]> {
        return this.executeWithLogging('bulkCreate', async () => {
            try {
                if (!data.length) return [];

                const {
                    ignoreDuplicates = false,
                    ignoreFields = [],
                    updateOnDuplicate,
                    ...restOptions
                } = operationOptions || {};

                const options: CreateOptions = {};
                this.applyOperationOptions(options, restOptions);

                if (ignoreDuplicates && ignoreFields.length > 0) {
                    const filters = data.map((item) => {
                        const filter: Record<string, unknown> = {};
                        ignoreFields.forEach((field) => {
                            const fieldValue = (item as Record<string, unknown>)[field as string];
                            if (fieldValue == null) {
                                throw new Error(`Field '${String(field)}' is required for duplicate check`);
                            }
                            filter[field as string] = fieldValue;
                        });
                        return filter;
                    });

                    const existing = await this._model.findAll({
                        where: { [Op.or]: filters },
                        attributes: ignoreFields as string[],
                        transaction: options.transaction,
                    });

                    const fingerprints = new Set(
                        existing.map((row: any) => ignoreFields.map((f) => row[f as string]).join('|')),
                    );

                    const toInsert = data.filter((item) => {
                        const itemFingerprint = ignoreFields
                            .map((f) => (item as Record<string, unknown>)[f as string])
                            .join('|');
                        return !fingerprints.has(itemFingerprint);
                    });

                    if (!toInsert.length) {
                        return [];
                    }

                    data = toInsert;
                }

                const bulkOptions: any = {
                    ...options,
                    validate: true,
                    returning: true,
                };

                if (updateOnDuplicate) {
                    bulkOptions.updateOnDuplicate = updateOnDuplicate;
                }

                const created = await this._model.bulkCreate(data as any[], bulkOptions);

                return created.map((r) => r.toJSON()) as T[];
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'bulkCreate' operation failed`,
                    'bulkCreate',
                    {
                        dataCount: data.length,
                        database: this._model.dbInstanceName,
                        model: this._model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async getAll(options: SequelizeGetAllOptions, filter?: WhereCondition): Promise<QueryResult<T>> {
        return this.executeWithLogging('find', async () => {
            try {
                const { count: shouldCount = true, operation, ...queryFilters } = options;

                const where = this.translateWhereCondition(filter);
                const _options = this.prepareOptions(queryFilters);

                const findOpts: FindAndCountOptions = {
                    where,
                    ..._options,
                };

                this.applyOperationOptions(findOpts, operation);

                if (options?.attributes) findOpts.attributes = options.attributes;
                if (options?.relations) findOpts.include = this.getFkRelation(options.relations);

                if (shouldCount) {
                    const results = await this._model.findAndCountAll(findOpts);

                    return {
                        rows: JSON.parse(JSON.stringify(results.rows)) as unknown as T[],
                        count: results.count,
                    };
                } else {
                    const rows = await this._model.findAll(findOpts);
                    return JSON.parse(JSON.stringify(rows)) as unknown as T[];
                }
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'find' operation failed`,
                    'findAll',
                    {
                        filter,
                        options,
                        database: this._model.dbInstanceName,
                        model: this._model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async getAllActive(options: SequelizeGetAllOptions, filter?: WhereCondition): Promise<QueryResult<T>> {
        const activeFilter = {
            ...filter,
            ...(this._model.tableName == 'status' ? {} : { status: 1 }),
        } as WhereCondition;

        return this.getAll(options, activeFilter);
    }

    async getById(id: ID, operationOptions?: SequelizeOperationOptions): Promise<T | null> {
        return this.executeWithLogging('findById', async () => {
            try {
                this.validateId(id, true);
                const options: FindOptions = { raw: true };

                if (operationOptions?.attributes) options.attributes = operationOptions.attributes;
                if (operationOptions?.relations) options.include = this.getFkRelation(operationOptions.relations);

                this.applyOperationOptions(options, operationOptions);

                const result = await this._model.findByPk(id, options);
                return JSON.parse(JSON.stringify(result)) as unknown as T | null;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'findById' operation failed`,
                    'findById',
                    {
                        id,
                        database: this._model.dbInstanceName,
                        model: this._model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async getOne(filter: WhereCondition, operationOptions?: SequelizeOperationOptions): Promise<T | null> {
        return this.executeWithLogging('findOne', async () => {
            try {
                const where = this.translateWhereCondition(filter);
                const options: FindOptions = {
                    where: where || {},
                };

                this.applyOperationOptions(options, operationOptions);

                if (operationOptions?.attributes) options.attributes = operationOptions.attributes;
                if (operationOptions?.relations) options.include = this.getFkRelation(operationOptions.relations);

                const result = await this._model.findOne(options);
                return JSON.parse(JSON.stringify(result)) as unknown as T | null;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'findOne' operation failed`,
                    'findOne',
                    {
                        filter,
                        database: this._model.dbInstanceName,
                        model: this._model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async update(
        criteria: ID | ID[] | WhereCondition,
        data: Partial<T>,
        operationOptions?: OperationOptions,
    ): Promise<number> {
        return this.executeWithLogging('update', async () => {
            try {
                const where = this.translateWhereCondition(criteria);
                const options: UpdateOptions = {
                    where: where || {},
                };

                this.applyOperationOptions(options, operationOptions);

                const [affectedRows] = await this._model.update(data, options);
                return affectedRows;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'update' operation failed`,
                    'update',
                    {
                        criteria,
                        data,
                        database: this._model.dbInstanceName,
                        model: this._model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async delete(criteria: ID | ID[] | WhereCondition, operationOptions?: OperationOptions): Promise<number> {
        return this.executeWithLogging('delete', async () => {
            try {
                const where = this.translateWhereCondition(criteria);
                const options: DestroyOptions = {
                    where: where || {},
                };

                this.applyOperationOptions(options, operationOptions);

                const affectedRows = await this._model.destroy(options);
                return affectedRows;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'delete' operation failed`,
                    'delete',
                    {
                        criteria,
                        database: this._model.dbInstanceName,
                        model: this._model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async count(filter: WhereCondition, operationOptions?: OperationOptions): Promise<number> {
        return this.executeWithLogging('count', async () => {
            try {
                const where = this.translateWhereCondition(filter);
                const options: CountOptions = { where };

                this.applyOperationOptions(options, operationOptions);

                const count = await this._model.count(options);
                return count;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'count' operation failed`,
                    'count',
                    {
                        filter,
                        database: this._model.dbInstanceName,
                        model: this._model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    protected validateId(id: any, alarm: boolean = false): boolean {
        if (id === null || id === undefined) {
            if (!alarm) return false;
            else
                throw new DatabaseError(`Invalid ID: ${id}`, 'validateId', {
                    id,
                    model: this._model.name,
                });
        }

        if (typeof id !== 'string' && typeof id !== 'number' && typeof id !== 'bigint') {
            if (!alarm) return false;
            else
                throw new DatabaseError(`ID must be string, number or bigint, got ${typeof id}: ${id}`, 'validateId', {
                    id,
                    model: this._model.name,
                });
        }

        return true;
    }

    async transaction<T>(
        callback: (t: Transaction) => Promise<T>,
        isolationLevel: keyof typeof Transaction.ISOLATION_LEVELS = 'READ_COMMITTED',
    ): Promise<T> {
        const sequelize = this._model.sequelize;
        if (!sequelize) throw new DatabaseError('Sequelize instance not available for transaction');

        return sequelize.transaction(
            {
                isolationLevel: Transaction.ISOLATION_LEVELS[isolationLevel],
            },
            callback,
        );
    }

    protected applyOperationOptions(targetOptions: any, operationOptions?: OperationOptions): void {
        if (!operationOptions) return;

        const { transaction, lock, skipLocked, paranoid, returning, plain, mapToModel, raw, ...restOptions } =
            operationOptions;

        if (transaction !== undefined) targetOptions.transaction = transaction;
        if (lock !== undefined) targetOptions.lock = lock;
        if (skipLocked !== undefined) targetOptions.skipLocked = skipLocked;
        if (paranoid !== undefined) targetOptions.paranoid = paranoid;
        if (returning !== undefined) targetOptions.returning = returning;
        if (plain !== undefined) targetOptions.plain = plain;
        if (mapToModel !== undefined) targetOptions.mapToModel = mapToModel;
        if (raw !== undefined) targetOptions.raw = raw;

        Object.assign(targetOptions, restOptions);
    }

    protected getFkRelation(config?: string | RelationConfig | RelationConfig[], targetModel?: any): Includeable[] {
        if (!config) return [];

        // 1. Si es string
        if (typeof config === 'string') {
            const assocs = (targetModel || this._model).associations;
            return assocs?.[config] ? [{ model: assocs[config].target, as: config }] : [];
        }

        // 2. Si es array de configs
        if (Array.isArray(config)) return config.flatMap((conf) => this.getFkRelation(conf, targetModel));

        // 3. Si no, es RelationConfig individual
        const { association, attributes, nested, required, where, separate } = config as RelationConfig;
        const assocs = (targetModel || this._model).associations;

        if (!assocs?.[association]) return [];

        const include: any = {
            model: assocs[association].target,
            as: association,
        };

        if (attributes?.length) include.attributes = attributes;
        if (required !== undefined) include.required = required;
        if (separate !== undefined) include.separate = separate;

        if (where) {
            include.where = this.translateWhereCondition(where as any);
            if (required !== undefined) include.required = required;
        }

        // Procesar nested
        if (nested) {
            const nestedConfigs = Array.isArray(nested) ? nested : [nested];
            include.include = nestedConfigs.flatMap((conf) => this.getFkRelation(conf, assocs[association].target));
        }

        return [include];
    }

    getModel(): ModelStatic<Model> {
        return this._model;
    }
}
