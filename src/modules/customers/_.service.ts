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

    /* Listar clientes — búsqueda por cédula opcional, útil en taquilla */
    async findAllCustomers(filters?: any) {
        const queryOptions = {
            count: true,
            relations: [
                {
                    association: '_People',
                    attributes: ['id', 'document_number', 'first_name', 'last_name', 'phone_number', 'personal_email'],
                },
            ],
        };

        return this._customers.getAll({ ...queryOptions, ...filters });
    }

    /* Registro rápido en taquilla (people + customers, sin user) */
    async createCustomer(body: any) {
        this.validateRequired(body, ['documentNumber', 'firstName', 'lastName']);

        const result = await this._people.transaction(async (transaction: Transaction) => {
            // Buscar o crear persona por cédula
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

            // Verificar que no exista ya un registro de cliente para esta persona
            const existingCustomer = await this._customers.getOne({ person: person.id });
            if (existingCustomer) {
                throw new ConflictError('El cliente ya existe para esta persona', 'CUSTOMER_ALREADY_EXISTS');
            }

            const customer = await this._customers.create(
                {
                    person: person.id,
                    level_progress_points: 0,
                    loyalty_level: 1, // Nivel inicial (Bronce, ID 1)
                },
                { transaction },
            );

            return customer;
        });

        return this._customers.getFull(result.id);
    }

    /* Expediente del cliente + datos biográficos */
    async findCustomerById(id: number) {
        const customer = await this._customers.getById(id, {
            relations: [
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
                },
            ],
        });

        if (!customer) throw new NotFoundError('Cliente no encontrado');
        return customer;
    }

    /* Actualizar datos biográficos (tabla people) */
    async updateCustomer(id: number, body: any) {
        const customer = await this._customers.getById(id);
        if (!customer) throw new NotFoundError('Cliente no encontrado');

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

        await this._people.update(customer.person, updateData);
        return null;
    }

    /* Caso de uso compartido: actualización de puntos de lealtad.
     * Usado tanto por ajustes manuales (admin) como por acumulación en compras (orders).
     * Aplica bloqueo a nivel de registro para evitar condiciones de carrera.
     * Actualiza atómicamente: loyalty_ledger + los tres campos desnormalizados en customers. */
    async applyLoyaltyPointsDelta(
        customerId: number,
        delta: number, // positivo = acumulación, negativo = canje/resta
        operationTypeId: number,
        orderId: number | null,
        remarks: string | null,
        transaction: Transaction,
    ): Promise<void> {
        // CORRECCIÓN: usar getById con lock explícito, que es más seguro que
        // getOne({ id }) ya que bypasa la traducción de filtros del repositorio.
        const customer = await this._customers.getById(customerId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!customer) throw new NotFoundError('Cliente no encontrado');

        const newProgress = (customer.level_progress_points ?? 0) + delta;

        if (newProgress < 0) {
            throw new ValidationError('Los puntos resultantes no pueden ser negativos', ['points']);
        }

        // Calcular nuevo nivel dentro de la misma transacción
        const newLevelId = await this._calculateLoyaltyLevel(newProgress, transaction);

        // Registrar movimiento en el ledger (append-only)
        await this._loyaltyLedgers.create(
            {
                customer: customerId,
                order: orderId,
                operation_type: operationTypeId,
                points: Math.abs(delta),
                remarks: remarks ?? null,
            },
            { transaction },
        );

        // Actualizar los tres campos desnormalizados atómicamente
        await this._customers.update(
            customerId,
            {
                level_progress_points: newProgress,
                loyalty_level: newLevelId,
            },
            { transaction },
        );
    }

    /* Ajuste manual administrativo de puntos (entrada pública del módulo customers).
     * Abre su propia transacción y delega la lógica a applyLoyaltyPointsDelta. */
    async adjustLoyaltyPoints(customerId: number, body: { operationType: number; points: number; remarks?: string }) {
        const { operationType, points, remarks } = body;

        this.validateRequired({ operationType, points } as any, ['operationType', 'points']);

        if (!Number.isInteger(points) || points <= 0) {
            throw new ValidationError('Los puntos deben ser un entero positivo', ['points']);
        }
        // 1 = acumulación (suma), 2 = deducción (resta)
        if (operationType !== 1 && operationType !== 2) {
            throw new ValidationError('Tipo de operación inválido (1 = suma, 2 = resta)', ['operationType']);
        }

        const delta = operationType === 1 ? points : -points;

        await this._customers.transaction(async (transaction: Transaction) => {
            await this.applyLoyaltyPointsDelta(
                customerId,
                delta,
                operationType,
                null, // sin orden asociada (ajuste manual)
                remarks ?? null,
                transaction,
            );
        });

        return null;
    }

    /* Calcula el nivel de lealtad a partir de los puntos acumulados.
     * Consulta dentro de la transacción activa para garantizar lectura consistente.
     *
     * CORRECCIÓN: getAll propaga transaction vía el campo `operation` en las opciones,
     * que internamente llama a applyOperationOptions → findOpts.transaction = t.
     * Se usa la firma correcta: getAll({ ..., operation: { transaction } }, filter). */
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

        // El nivel por defecto es el primero (menor umbral, ej. Bronce con required_points = 0)
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
