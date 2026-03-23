import { type ProcessedQueryFilters } from '@rules/api-query.type.js';

type BaseQueryOptions = {
    page?: string;
    limit?: string;
};

type DynamicQueryOptions = {
    [K in `order.${string}`]?: 'asc' | 'desc';
} & {
    [K in `q.${string}`]?: string | number;
};

export type QueryOptions = BaseQueryOptions & DynamicQueryOptions;

// Tipo para resultados opcionales
export type QueryResult<T> =
    | {
          rows: T[];
          count?: number;
      }
    | T[];

// Interfaz para opciones de operación (transacciones, locks, etc.)
export interface RepositoryOperationOptions {
    // Opciones comunes a todos los ORMs/Drivers
    [key: string]: any;
}

// Tipo específico para las opciones de getAll
export interface GetAllOptions extends Partial<ProcessedQueryFilters> {
    count?: boolean;
    operation?: RepositoryOperationOptions;
}

export const WhereOperators = {
    // Comparación
    eq: Symbol('eq'),
    ne: Symbol('ne'),
    gt: Symbol('gt'),
    gte: Symbol('gte'),
    lt: Symbol('lt'),
    lte: Symbol('lte'),

    // Texto
    contains: Symbol('contains'),
    startsWith: Symbol('startsWith'),
    endsWith: Symbol('endsWith'),

    // Arrays
    in: Symbol('in'),
    notIn: Symbol('notIn'),
    between: Symbol('between'),

    // Nulos
    isNull: Symbol('isNull'),
    isNotNull: Symbol('isNotNull'),

    // Lógicos (para composición)
    and: Symbol('and'),
    or: Symbol('or'),
} as const;

export type WhereOperator = (typeof WhereOperators)[keyof typeof WhereOperators];

// Condición simple con operador simbólico
export type SimpleWhereCondition = {
    [field: string]:
        | any
        | {
              [operator in WhereOperator]?: any;
          };
};

// Condición compuesta (AND/OR anidados)
export type CompoundWhereCondition = {
    [WhereOperators.and]?: WhereCondition[];
    [WhereOperators.or]?: WhereCondition[];
};

// Condición completa
export type WhereCondition = SimpleWhereCondition | CompoundWhereCondition;

export abstract class BaseRepository<T, ID = string | number, M = unknown> {
    protected _model: M;

    constructor(model: M) {
        this._model = model;
    }

    protected get repositoryName(): string {
        return this.constructor.name;
    }

    protected async executeWithLogging<R>(operation: string, action: () => Promise<R>): Promise<R> {
        try {
            //const startTime = Date.now();
            const result = await action();
            //const duration = Date.now() - startTime;

            // Logger.info(`[${this.repositoryName}] ${operation} completed in ${duration}ms`);
            return result;
        } catch (error: any) {
            throw error;
        }
    }

    abstract create(data: Partial<T>, operationOptions?: RepositoryOperationOptions): Promise<T>;

    abstract bulkCreate?(
        data: Partial<T>[],
        operationOptions?: RepositoryOperationOptions & { [key: string]: any },
    ): Promise<T[]>;

    abstract getAll(
        options: GetAllOptions,
        conditions?: Partial<T> | Record<string, unknown> | WhereCondition,
    ): Promise<QueryResult<T>>;

    abstract getAllActive(
        options: GetAllOptions,
        conditions?: Partial<T> | Record<string, unknown> | WhereCondition,
    ): Promise<QueryResult<T>>;

    abstract getById(id: ID, operationOptions?: RepositoryOperationOptions): Promise<T | null>;

    abstract getOne(
        conditions: Partial<T> | Record<string, unknown> | WhereCondition,
        operationOptions?: RepositoryOperationOptions,
    ): Promise<T | null>;

    abstract update(
        criteria: ID | ID[] | Partial<T> | Record<string, unknown> | WhereCondition,
        data: Partial<T>,
        operationOptions?: RepositoryOperationOptions & { returnModel?: boolean },
    ): Promise<number | T | T[] | null>;

    abstract delete(
        criteria: ID | ID[] | Partial<T> | Record<string, unknown> | WhereCondition,
        operationOptions?: RepositoryOperationOptions & { returnModel?: boolean },
    ): Promise<number | T | T[] | boolean>;

    abstract count(
        conditions: Partial<T> | Record<string, unknown> | WhereCondition,
        operationOptions?: RepositoryOperationOptions,
    ): Promise<number>;

    protected abstract translateWhereCondition(conditions: WhereCondition): Record<string, unknown>;

    protected sanitizeFilter(conditions: WhereCondition): WhereCondition {
        if (!conditions) return {};

        if (typeof conditions === 'object' && conditions !== null) {
            const hasSymbols = Object.getOwnPropertySymbols(conditions).length > 0;

            if (hasSymbols) return conditions;
        }

        const sanitized: Record<string, unknown> = {};
        const filterObj = conditions as Record<string, unknown>;

        Object.entries(filterObj).forEach(([key, value]) => {
            if (value !== undefined && value !== null) sanitized[key] = value;
        });

        return sanitized;
    }

    protected prepareOptions(options: Partial<ProcessedQueryFilters>): Record<string, unknown> {
        const { pagination, order } = options;
        const _options: Record<string, unknown> = { ...pagination };

        if (order && order.length) _options.order = order;

        return _options;
    }

    protected validateId?(id: ID): void {
        if (id === null || id === undefined || id === '') throw new Error(`Invalid ID: ${id}`);
    }

    get model(): M {
        return this._model;
    }
}
