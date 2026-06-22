import { BaseService } from '@bases/service.base.js';
import { Database, Ops } from '@database/index.js';
import { NotFoundError, ValidationError, ConflictError } from '@errors/index.js';
import { Transaction } from 'sequelize';
import { ORDER_STATUS, LOYALTY_OPERATION } from '@constants/magic-vars.constant.js';

class InvoiceManagementService extends BaseService {
    constructor() {
        super();
    }

    private get _invoices() { return Database.repository('main', 'invoices') as any; }
    private get _orders() { return Database.repository('main', 'orders') as any; }
    private get _orderLines() { return Database.repository('main', 'order-lines') as any; }
    private get _orderPayments() { return Database.repository('main', 'order-payments') as any; }
    private get _orderTaxes() { return Database.repository('main', 'order-taxes') as any; }
    private get _tickets() { return Database.repository('main', 'tickets') as any; }
    private get _customers() { return Database.repository('main', 'customers') as any; }
    private get _loyaltyLedgers() { return Database.repository('main', 'loyalty-ledgers') as any; }

    // ── Listado con filtros ───────────────────────────────────────────────────

    async findAll(filters: {
        cinemaId?: number;
        employeeId?: number;
        from?: string;
        to?: string;
        search?: string;
        status?: 'all' | 'active' | 'voided';
        page?: number;
        limit?: number;
    }) {
        const { cinemaId, employeeId, from, to, search, status = 'all', page = 1, limit = 20 } = filters;

        const where: any = {};
        const paranoid = status === 'active';

        if (from || to) {
            const dateRange: any = {};
            if (from) dateRange[Ops.gte] = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                dateRange[Ops.lte] = toDate;
            }
            where.issued_at = dateRange;
        }

        if (search) {
            where[Ops.or] = [
                { invoice_number: { [Ops.contains]: search } },
                { billing_name: { [Ops.contains]: search } },
                { billing_document: { [Ops.contains]: search } },
            ];
        }

        if (status === 'voided') {
            where.deleted_at = { [Ops.isNotNull]: true };
        }

        const relations: any[] = [
            {
                association: '_Orders',
                attributes: ['id', 'cinema', 'employee', 'total_amount_base_currency', 'order_status', 'created_at'],
                nested: [
                    { association: '_Cinemas', attributes: ['id', 'name'] },
                    {
                        association: '_Employees',
                        attributes: ['id', 'person'],
                        nested: [{ association: '_People', attributes: ['first_name', 'last_name'] }],
                    },
                    { association: '_OrderStatuses', attributes: ['id', 'description'] },
                    { association: '_Currencies', attributes: ['id', 'code', 'symbol'] },
                ],
            },
        ];

        const raw = await this._invoices.getAll(
            {
                count: true,
                attributes: [
                    'id', 'invoice_number', 'billing_name', 'billing_document',
                    'billing_address', 'issued_at', 'deleted_at', 'voided_reason',
                ],
                relations,
                order: [['issued_at', 'DESC']],
                limit,
                offset: (page - 1) * limit,
                operation: { paranoid },
            },
            where,
        );

        const rows = Array.isArray(raw) ? raw : raw?.rows ?? [];
        const count = Array.isArray(raw) ? rows.length : raw?.count ?? 0;

        const filtered = rows.filter((inv: any) => {
            if (cinemaId && inv._Orders?.cinema !== cinemaId) return false;
            if (employeeId && inv._Orders?.employee !== employeeId) return false;
            return true;
        });

        return {
            invoices: filtered.map(this._formatListItem),
            pagination: { page, limit, total: count },
        };
    }

    // ── Detalle completo ──────────────────────────────────────────────────────

    async findById(id: number, cinemaId?: number) {
        const invoice = await this._invoices.getOne(
            { id },
            {
                paranoid: false,
                attributes: [
                    'id', 'invoice_number', 'billing_name', 'billing_document',
                    'billing_address', 'issued_at', 'deleted_at', 'voided_reason',
                ],
                relations: [
                    {
                        association: '_Orders',
                        attributes: [
                            'id', 'cinema', 'employee', 'customer', 'subtotal_base_currency',
                            'tax_amount_base_currency', 'total_amount_base_currency',
                            'generated_points', 'qr_code', 'order_status', 'created_at',
                        ],
                        nested: [
                            { association: '_Cinemas', attributes: ['id', 'name', 'address'] },
                            {
                                association: '_Employees',
                                attributes: ['id', 'person'],
                                nested: [{ association: '_People', attributes: ['first_name', 'last_name', 'document_number'] }],
                            },
                            {
                                association: '_Customers',
                                attributes: ['id', 'person'],
                                nested: [{ association: '_People', attributes: ['first_name', 'last_name', 'document_number', 'personal_email', 'phone_number'] }],
                            },
                            { association: '_OrderStatuses', attributes: ['id', 'description'] },
                            { association: '_Currencies', attributes: ['id', 'code', 'symbol'] },
                        ],
                    },
                    {
                        association: '_VoidedByEmployee',
                        attributes: ['id', 'person'],
                        nested: [{ association: '_People', attributes: ['first_name', 'last_name'] }],
                    },
                ],
            },
        );

        if (!invoice) throw new NotFoundError('Factura no encontrada');

        if (cinemaId && invoice._Orders?.cinema !== cinemaId) {
            throw new NotFoundError('Factura no encontrada');
        }

        const orderId = invoice.order ?? invoice._Orders?.id;

        const [lines, payments, taxes] = await Promise.all([
            this._orderLines.getAll(
                {
                    count: false,
                    attributes: ['id', 'line_type', 'quantity', 'original_unit_price', 'unit_price'],
                    relations: [
                        { association: '_Products', attributes: ['id', 'name', 'sku'] },
                        { association: '_Combos', attributes: ['id', 'name'] },
                        { association: '_LineTypes', attributes: ['id', 'description'] },
                    ],
                },
                { order: orderId },
            ),
            this._orderPayments.getAll(
                {
                    count: false,
                    attributes: ['id', 'amount', 'reference_number', 'is_approved'],
                    relations: [
                        { association: '_PaymentMethods', attributes: ['id', 'description'] },
                        {
                            association: '_ExchangeRates',
                            attributes: ['id', 'rate', 'currency'],
                            nested: [{ association: '_Currencies', attributes: ['id', 'code', 'symbol'] }],
                        },
                    ],
                },
                { order: orderId },
            ),
            this._orderTaxes.getAll(
                {
                    count: false,
                    attributes: ['id', 'applied_rate', 'tax_amount_base_currency'],
                    relations: [{ association: '_Taxes', attributes: ['id', 'name', 'rate'] }],
                },
                { order: orderId },
            ),
        ]);

        return this._formatDetail(invoice, lines, payments, taxes);
    }

    // ── Anulación ─────────────────────────────────────────────────────────────
    //
    // economy.md exige que el Backend sea la única fuente de verdad financiera
    // y que el ledger de puntos sea append-only. Anular una factura no es un
    // simple soft-delete: implica revertir el efecto económico de la orden.
    //
    // Reglas aplicadas:
    //   1. No se puede anular una orden cuyos tickets ya fueron validados
    //      (el servicio ya se consumió — eso requiere un flujo de nota de
    //      crédito distinto, no una anulación).
    //   2. Si la orden generó puntos de lealtad, se revierten con un NUEVO
    //      registro en loyalty_ledgers (operation_type SPEND), nunca editando
    //      o borrando el registro EARN original — el ledger es inmutable.
    //   3. La orden pasa a order_status = CANCELLED (reutiliza el catálogo
    //      existente en ORDER_STATUS, no se inventa un estado nuevo).
    //   4. Todo ocurre en una sola transacción Sequelize.

    async voidInvoice(id: number, reason: string, employeeId: number, cinemaId?: number) {
        if (!reason?.trim()) throw new ValidationError('El motivo de anulación es requerido');
        if (!employeeId) throw new ValidationError('No se pudo determinar el empleado desde la sesión');

        const invoice = await this._invoices.getOne(
            { id },
            {
                paranoid: true,
                attributes: ['id', 'order', 'deleted_at'],
                relations: [
                    {
                        association: '_Orders',
                        attributes: ['id', 'cinema', 'customer', 'generated_points', 'order_status'],
                    },
                ],
            },
        );

        if (!invoice) throw new NotFoundError('Factura no encontrada');
        if (invoice.deleted_at) throw new ValidationError('La factura ya se encuentra anulada');

        const order = invoice._Orders;
        if (!order) throw new NotFoundError('La orden asociada a esta factura no existe');
        if (cinemaId && order.cinema !== cinemaId) throw new NotFoundError('Factura no encontrada');

        if (order.order_status === ORDER_STATUS.CANCELLED) {
            throw new ValidationError('La orden asociada ya se encuentra cancelada');
        }

        // Guard: si ya se validaron tickets (el cliente entró a la sala), la
        // anulación simple no aplica — el servicio ya fue consumido.
        const validatedTicketsCount = await this._tickets.count({
            order: order.id,
            validation_time: { [Ops.isNotNull]: true },
        });
        if (validatedTicketsCount > 0) {
            throw new ConflictError(
                'No se puede anular: la orden tiene boletos ya validados (servicio consumido). ' +
                    'Esta operación requiere un flujo de nota de crédito.',
                'INVOICE_TICKETS_ALREADY_VALIDATED',
            );
        }

        await this._invoices.transaction(async (transaction: Transaction) => {
            // 1. Reversa de puntos de lealtad (si la orden los generó)
            const earnedPoints = Number(order.generated_points ?? 0);
            if (order.customer && earnedPoints > 0) {
                const customer = await this._customers.getById(order.customer, {
                    attributes: ['id', 'level_progress_points'],
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });

                if (customer) {
                    const currentLevelPoints = Number(customer.level_progress_points ?? 0);
                    const newLevelPoints = Math.max(0, currentLevelPoints - earnedPoints);

                    const lastLedger = await this._loyaltyLedgers.getAll(
                        { count: false, order: [['id', 'DESC']], limit: 1, operation: { transaction, lock: transaction.LOCK.UPDATE } },
                        { customer: order.customer },
                    );
                    const currentSpendableBalance = lastLedger.length > 0 ? Number(lastLedger[0].points_balance) : 0;
                    const newSpendableBalance = Math.max(0, currentSpendableBalance - earnedPoints);

                    await this._loyaltyLedgers.create(
                        {
                            customer: order.customer,
                            order: order.id,
                            operation_type: LOYALTY_OPERATION.SPEND,
                            points: earnedPoints,
                            points_balance: newSpendableBalance,
                            remarks: `Reversa de puntos por anulación de factura #${id} (orden #${order.id})`,
                        },
                        { transaction },
                    );

                    await this._customers.update(
                        order.customer,
                        { level_progress_points: newLevelPoints },
                        { transaction },
                    );
                }
            }

            // 2. La orden pasa a estado CANCELLED
            await this._orders.update(
                { id: order.id },
                { order_status: ORDER_STATUS.CANCELLED },
                { transaction },
            );

            // 3. Registrar motivo y empleado responsable
            await this._invoices.update(
                { id },
                { voided_reason: reason.trim(), voided_by: employeeId },
                { transaction },
            );

            // 4. Soft delete de la factura (activa deleted_at vía paranoid)
            await this._invoices.delete({ id }, { transaction });
        });
    }

    // ── Formatters privados ───────────────────────────────────────────────────

    private _formatListItem(inv: any) {
        const order = inv._Orders;
        return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            billing_name: inv.billing_name,
            billing_document: inv.billing_document,
            issued_at: inv.issued_at,
            is_voided: !!inv.deleted_at,
            voided_reason: inv.voided_reason ?? null,
            order: order
                ? {
                      id: order.id,
                      total: order.total_amount_base_currency,
                      currency: order._Currencies,
                      status: order._OrderStatuses,
                      cinema: order._Cinemas,
                      employee: order._Employees?._People
                          ? { id: order._Employees.id, name: `${order._Employees._People.first_name} ${order._Employees._People.last_name ?? ''}`.trim() }
                          : null,
                  }
                : null,
        };
    }

    private _formatDetail(inv: any, lines: any[], payments: any[], taxes: any[]) {
        const order = inv._Orders;
        const customer = order?._Customers?._People;
        const employee = order?._Employees?._People;
        const voidedBy = inv._VoidedByEmployee?._People;

        return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            billing_name: inv.billing_name,
            billing_document: inv.billing_document,
            billing_address: inv.billing_address ?? null,
            issued_at: inv.issued_at,
            is_voided: !!inv.deleted_at,
            voided_reason: inv.voided_reason ?? null,
            voided_by: voidedBy
                ? { id: inv._VoidedByEmployee.id, name: `${voidedBy.first_name} ${voidedBy.last_name ?? ''}`.trim() }
                : null,
            cinema: order?._Cinemas ?? null,
            employee: employee
                ? { id: order._Employees.id, name: `${employee.first_name} ${employee.last_name ?? ''}`.trim(), document: employee.document_number }
                : null,
            customer: customer
                ? {
                      id: order._Customers.id,
                      name: `${customer.first_name} ${customer.last_name ?? ''}`.trim(),
                      document: customer.document_number,
                      email: customer.personal_email ?? null,
                      phone: customer.phone_number ?? null,
                  }
                : null,
            order: order
                ? {
                      id: order.id,
                      subtotal: order.subtotal_base_currency,
                      tax_amount: order.tax_amount_base_currency,
                      total: order.total_amount_base_currency,
                      generated_points: order.generated_points,
                      qr_code: order.qr_code,
                      created_at: order.created_at,
                      // currency = moneda base del sistema (la que reporta esta orden).
                      // Si is_base_currency es true para VES, este monto YA está en
                      // bolívares — no requiere conversión adicional para mostrarse.
                      currency: order._Currencies,
                      status: order._OrderStatuses,
                  }
                : null,
            lines: (Array.isArray(lines) ? lines : []).map((l: any) => ({
                id: l.id,
                type: l._LineTypes,
                item: l._Products ?? l._Combos ?? null,
                quantity: l.quantity,
                original_unit_price: l.original_unit_price,
                unit_price: l.unit_price,
                line_total: Number(l.unit_price) * Number(l.quantity),
            })),
            // Cada pago se guarda SIEMPRE convertido a la moneda base (bolívares).
            // Si el cliente pagó en otra moneda (ej. USD), reconstruimos el monto
            // y la moneda originales dividiendo por la tasa usada en ese momento
            // (quoted_exchange_rate), para que la factura pueda desglosar ambos
            // valores cuando el pago no fue en bolívares.
            payments: (Array.isArray(payments) ? payments : []).map((p: any) => {
                const rate = p._ExchangeRates?.rate ? Number(p._ExchangeRates.rate) : null;
                const paymentCurrency = p._ExchangeRates?._Currencies ?? null;
                const amountBaseCurrency = Number(p.amount);
                const wasPaidInBaseCurrency = !paymentCurrency || paymentCurrency.code === order?._Currencies?.code;

                return {
                    id: p.id,
                    method: p._PaymentMethods,
                    amount_base_currency: amountBaseCurrency,
                    base_currency: order?._Currencies ?? null,
                    paid_in_other_currency: !wasPaidInBaseCurrency,
                    original_currency: !wasPaidInBaseCurrency ? paymentCurrency : null,
                    original_amount: !wasPaidInBaseCurrency && rate ? Number((amountBaseCurrency / rate).toFixed(2)) : null,
                    exchange_rate: !wasPaidInBaseCurrency ? rate : null,
                    reference_number: p.reference_number ?? null,
                    is_approved: p.is_approved,
                };
            }),
            taxes: (Array.isArray(taxes) ? taxes : []).map((t: any) => ({
                id: t.id,
                tax: t._Taxes,
                applied_rate: t.applied_rate,
                amount: t.tax_amount_base_currency,
            })),
        };
    }
}

export default new InvoiceManagementService();
