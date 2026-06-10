import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError, ValidationError, ConflictError } from '@errors';
import { Transaction } from 'sequelize';

export class CustomersService extends BaseService {
    constructor() {
        super();
    }

    private get _customers() {
        return Database.repository('main', 'customers') as any;
    }
    private get _people() {
        return Database.repository('main', 'people') as any;
    }
    private get _loyaltyLedgers() {
        return Database.repository('main', 'loyalty-ledgers') as any;
    }
    private get _loyaltyLevels() {
        return Database.repository('main', 'loyalty-levels') as any;
    }

    private _formatCustomerResponse(raw: any) {
        if (!raw) return null;

        const { _People: people, _LoyaltyLevels: loyaltyLevel, deleted_at, person, ...customerFields } = raw;

        return {
            person: people
                ? {
                      id: people.id,
                      document_number: people.document_number,
                      first_name: people.first_name,
                      last_name: people.last_name,
                      gender: people.gender ?? null,
                      phone_number: people.phone_number ?? null,
                      personal_email: people.personal_email ?? null,
                      birth_date: people.birth_date ?? null,
                  }
                : null,

            customer: {
                ...customerFields,
                loyalty: {
                    level_id: customerFields.loyalty_level,
                    level_name: loyaltyLevel?.name ?? null,
                    progress_points: customerFields.level_progress_points,
                },
            },
        };
    }

    async findAllCustomers(filters?: any) {
        // Las relaciones viven en el repositorio — se reutilizan sin duplicar.
        const result = await this._customers.getAll({
            count: true,
            relations: this._customers.relations,
            ...filters,
        });

        if (Array.isArray(result)) {
            return result.map((c: any) => this._formatCustomerResponse(c));
        }

        return {
            ...result,
            rows: result.rows.map((c: any) => this._formatCustomerResponse(c)),
        };
    }

    async createCustomer(body: any) {
        this.validateRequired(body, ['documentNumber', 'firstName', 'lastName']);

        const result = await this._people.transaction(async (transaction: Transaction) => {
            let person = await this._people.getOne({ document_number: body.documentNumber });
            if (!person) {
                person = await this._people.create(
                    {
                        document_number: body.documentNumber,
                        first_name: body.firstName,
                        last_name: body.lastName,
                        gender: body.gender ?? null,
                        phone_number: body.phoneNumber ?? null,
                        personal_email: body.email ?? null,
                        birth_date: body.birthDate ?? null,
                    },
                    { transaction },
                );
            }

            const existingCustomer = await this._customers.getOne({ person: person.id });
            if (existingCustomer) {
                throw new ConflictError('El cliente ya existe para esta persona', 'CUSTOMER_ALREADY_EXISTS');
            }

            const customer = await this._customers.create(
                {
                    person: person.id,
                    level_progress_points: 0,
                    loyalty_level: 1,
                },
                { transaction },
            );

            return customer;
        });

        const raw = await this._customers.getFull(result.id);
        return this._formatCustomerResponse(raw);
    }

    async findCustomerById(id: number) {
        // Reutiliza las mismas relaciones del repositorio.
        const raw = await this._customers.getById(id, {
            relations: this._customers.relations,
        });

        if (!raw) throw new NotFoundError('Cliente no encontrado');
        return this._formatCustomerResponse(raw);
    }

    async updateCustomer(id: number, body: any) {
        const updateData: Record<string, any> = {};
        if (body.firstName !== undefined) updateData.first_name = body.firstName;
        if (body.lastName !== undefined) updateData.last_name = body.lastName;
        if (body.phoneNumber !== undefined) updateData.phone_number = body.phoneNumber;
        if (body.email !== undefined) updateData.personal_email = body.email;
        if (body.birthDate !== undefined) updateData.birth_date = body.birthDate;
        if (body.gender !== undefined) updateData.gender = body.gender;

        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('No se proporcionaron datos biográficos para actualizar', []);
        }

        await this._customers.transaction(async (transaction: Transaction) => {
            const customer = await this._customers.getById(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!customer) throw new NotFoundError('Cliente no encontrado');

            const person = await this._people.getById(customer.person, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!person) throw new NotFoundError('Registro de persona no encontrado');

            await this._people.update(customer.person, updateData, { transaction });
        });

        return null;
    }

    /**
     * Caso de uso compartido: actualización atómica de puntos de lealtad.
     * Requiere una transacción activa — el llamador es responsable de abrirla.
     */
    async applyLoyaltyPointsDelta(
        customerId: number,
        delta: number,
        operationTypeId: number,
        orderId: number | null,
        transaction: Transaction,
    ): Promise<void> {
        const customer = await this._customers.getById(customerId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!customer) throw new NotFoundError('Cliente no encontrado');

        const newProgress = (customer.level_progress_points ?? 0) + delta;

        if (newProgress < 0) {
            throw new ValidationError('Los puntos resultantes no pueden ser negativos', ['points']);
        }

        const newLevelId = await this._calculateLoyaltyLevel(newProgress, transaction);

        await this._loyaltyLedgers.create(
            {
                customer: customerId,
                order: orderId,
                operation_type: operationTypeId,
                points: Math.abs(delta),
            },
            { transaction },
        );

        await this._customers.update(
            customerId,
            {
                level_progress_points: newProgress,
                loyalty_level: newLevelId,
            },
            { transaction },
        );
    }

    async adjustLoyaltyPoints(customerId: number, body: { operationType: number; points: number }) {
        const { operationType, points } = body;

        this.validateRequired({ operationType, points } as any, ['operationType', 'points']);

        if (!Number.isInteger(points) || points <= 0) {
            throw new ValidationError('Los puntos deben ser un entero positivo', ['points']);
        }
        if (operationType !== 1 && operationType !== 2) {
            throw new ValidationError('Tipo de operación inválido (1 = suma, 2 = resta)', ['operationType']);
        }

        const delta = operationType === 1 ? points : -points;

        await this._customers.transaction(async (transaction: Transaction) => {
            await this.applyLoyaltyPointsDelta(customerId, delta, operationType, null, transaction);
        });

        return null;
    }

    private async _calculateLoyaltyLevel(points: number, transaction?: Transaction): Promise<number> {
        const levels = await this._loyaltyLevels.getAll(
            {
                count: false,
                order: [['required_points', 'ASC']],
                operation: transaction ? { transaction } : undefined,
            },
            {},
        );

        const levelsList: any[] = Array.isArray(levels) ? levels : (levels?.rows ?? []);

        let targetLevel = levelsList[0]?.id ?? 1;
        for (const level of levelsList) {
            if (points >= (level.required_points ?? 0)) {
                targetLevel = level.id;
            } else {
                break;
            }
        }

        return targetLevel;
    }
}

export default new CustomersService();
