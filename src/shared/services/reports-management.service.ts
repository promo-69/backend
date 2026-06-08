import { Database, Ops } from '@database/index.js';
import { ValidationError } from '@errors';

// ── IDs de catálogo ───────────────────────────────────────────────────────────
const PAID_STATUSES = [2, 4]; // order_statuses: 2=Pagada, 4=Completada
const INVENTORY_OP_SALE = 4; // Salida de Inventario (Venta)
const INVENTORY_OP_ENTRY = 3; // Entrada de Inventario (Compra a Proveedor)
const RENTAL_STATUS_PAID = 3;
const RENTAL_STATUS_PENDING = 1;
const RENTAL_STATUS_PENDING_PMT = 2;

export class ReportsManagementService {
    private get _orders() {
        return Database.repository('main', 'orders') as any;
    }
    private get _orderPayments() {
        return Database.repository('main', 'order-payments') as any;
    }
    private get _orderLines() {
        return Database.repository('main', 'order-lines') as any;
    }
    private get _tickets() {
        return Database.repository('main', 'tickets') as any;
    }
    private get _showtimes() {
        return Database.repository('main', 'showtimes') as any;
    }
    private get _roomBookings() {
        return Database.repository('main', 'room-bookings') as any;
    }
    private get _rooms() {
        return Database.repository('main', 'rooms') as any;
    }
    private get _seats() {
        return Database.repository('main', 'seats') as any;
    }
    private get _inventories() {
        return Database.repository('main', 'inventories') as any;
    }
    private get _inventoryMovements() {
        return Database.repository('main', 'inventory-movements') as any;
    }
    private get _rentalRequests() {
        return Database.repository('main', 'rental-requests') as any;
    }

    private _toList(r: any): any[] {
        return Array.isArray(r) ? r : (r?.rows ?? []);
    }

    private _buildDateRange(from?: string, to?: string): { from: Date; to: Date } {
        let dateFrom: Date;
        let dateTo: Date;

        if (from) {
            dateFrom = new Date(from);
            if (isNaN(dateFrom.getTime())) throw new ValidationError('"from" no es una fecha válida (YYYY-MM-DD)');
            dateFrom.setUTCHours(0, 0, 0, 0);
        } else {
            // Mes en curso por defecto
            dateFrom = new Date();
            dateFrom.setUTCDate(1);
            dateFrom.setUTCHours(0, 0, 0, 0);
        }

        if (to) {
            dateTo = new Date(to);
            if (isNaN(dateTo.getTime())) throw new ValidationError('"to" no es una fecha válida (YYYY-MM-DD)');
            dateTo.setUTCHours(23, 59, 59, 999);
        } else {
            dateTo = new Date();
            dateTo.setUTCHours(23, 59, 59, 999);
        }

        if (dateFrom > dateTo) throw new ValidationError('"from" no puede ser posterior a "to"');
        return { from: dateFrom, to: dateTo };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. VENTAS
    // ─────────────────────────────────────────────────────────────────────────

    async getSalesReport(cinemaId: number, filters: { from?: string; to?: string; channel?: string } = {}) {
        const { from, to } = this._buildDateRange(filters.from, filters.to);

        const orderWhere: any = {
            cinema: cinemaId,
            order_status: PAID_STATUSES,
            created_at: { [Ops.between]: [from, to] },
        };
        if (filters.channel === 'taquilla') orderWhere.employee = { [Ops.ne]: null };
        else if (filters.channel === 'web' || filters.channel === 'app') orderWhere.employee = null;

        const ordersRaw = await this._orders.getAll(
            {
                count: true,
                attributes: [
                    'id',
                    'subtotal_base_currency',
                    'tax_amount_base_currency',
                    'total_amount_base_currency',
                    'created_at',
                ],
            },
            orderWhere,
        );
        const orders: any[] = this._toList(ordersRaw);
        const totalOrders: number = Array.isArray(ordersRaw) ? orders.length : ordersRaw.count;

        if (orders.length === 0) {
            return {
                period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
                channel: filters.channel ?? 'all',
                summary: {
                    total_orders: 0,
                    total_tickets: 0,
                    total_revenue: 0,
                    total_tax: 0,
                    total_concessions_revenue: 0,
                    net_revenue: 0,
                },
                breakdown_by_payment_method: [],
                daily_series: [],
            };
        }

        const orderIds = orders.map((o: any) => o.id);

        const [ticketsRaw, linesRaw, paymentsRaw] = await Promise.all([
            this._tickets.getAll({ count: false, attributes: ['id', 'order'] }, { order: orderIds }),
            this._orderLines.getAll(
                { count: false, attributes: ['id', 'order', 'quantity', 'unit_price'] },
                { order: orderIds },
            ),
            this._orderPayments.getAll(
                {
                    count: false,
                    attributes: ['id', 'order', 'payment_method', 'amount'],
                    relations: [{ association: '_PaymentMethods', attributes: ['id', 'description'] }],
                },
                { order: orderIds, is_approved: true },
            ),
        ]);

        const tickets: any[] = this._toList(ticketsRaw);
        const lines: any[] = this._toList(linesRaw);
        const payments: any[] = this._toList(paymentsRaw);

        const totalTickets = tickets.length;
        const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total_amount_base_currency), 0);
        const totalTax = orders.reduce((s: number, o: any) => s + Number(o.tax_amount_base_currency), 0);
        const totalConcessions = lines.reduce((s: number, l: any) => s + Number(l.unit_price) * Number(l.quantity), 0);

        // Desglose por método de pago
        const pmMap = new Map<number, { description: string; amount: number; count: number }>();
        for (const p of payments) {
            const id = p.payment_method;
            const desc = p._PaymentMethods?.description ?? `Método ${id}`;
            if (!pmMap.has(id)) pmMap.set(id, { description: desc, amount: 0, count: 0 });
            pmMap.get(id)!.amount += Number(p.amount);
            pmMap.get(id)!.count += 1;
        }
        const breakdown_by_payment_method = [...pmMap.entries()].map(([id, v]) => ({
            payment_method: { id, description: v.description },
            total_amount: Math.round(v.amount * 100) / 100,
            transaction_count: v.count,
        }));

        // Serie diaria
        const ticketsByOrder = new Map<number, number>();
        for (const t of tickets) ticketsByOrder.set(t.order, (ticketsByOrder.get(t.order) ?? 0) + 1);

        const dailyMap = new Map<string, { revenue: number; orders: number; tickets: number }>();
        for (const o of orders) {
            const day = new Date(o.created_at).toISOString().slice(0, 10);
            if (!dailyMap.has(day)) dailyMap.set(day, { revenue: 0, orders: 0, tickets: 0 });
            const slot = dailyMap.get(day)!;
            slot.revenue += Number(o.total_amount_base_currency);
            slot.orders += 1;
            slot.tickets += ticketsByOrder.get(o.id) ?? 0;
        }
        const daily_series = [...dailyMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({
                date,
                orders: v.orders,
                tickets: v.tickets,
                revenue: Math.round(v.revenue * 100) / 100,
            }));

        return {
            period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
            channel: filters.channel ?? 'all',
            summary: {
                total_orders: totalOrders,
                total_tickets: totalTickets,
                total_revenue: Math.round(totalRevenue * 100) / 100,
                total_tax: Math.round(totalTax * 100) / 100,
                total_concessions_revenue: Math.round(totalConcessions * 100) / 100,
                net_revenue: Math.round((totalRevenue - totalConcessions) * 100) / 100,
            },
            breakdown_by_payment_method,
            daily_series,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PELÍCULAS
    // ─────────────────────────────────────────────────────────────────────────

    async getMoviesReport(cinemaId: number, filters: { from?: string; to?: string } = {}) {
        const { from, to } = this._buildDateRange(filters.from, filters.to);

        const roomsRaw = await this._rooms.getAll({ count: false, attributes: ['id'] }, { cinema: cinemaId });
        const roomList: any[] = this._toList(roomsRaw);
        if (roomList.length === 0)
            return { period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }, movies: [] };

        const roomIds = roomList.map((r: any) => r.id);

        const bookingsRaw = await this._roomBookings.getAll(
            { count: false, attributes: ['id', 'room', 'start_time'] },
            { room: roomIds, start_time: { [Ops.between]: [from, to] } },
        );
        const bookings: any[] = this._toList(bookingsRaw);
        if (bookings.length === 0)
            return { period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }, movies: [] };

        const bookingIds = bookings.map((b: any) => b.id);
        const bookingMap = new Map<number, any>(bookings.map((b: any) => [b.id, b]));

        const showtimesRaw = await this._showtimes.getAll(
            {
                count: false,
                attributes: ['id', 'booking', 'movie'],
                relations: [{ association: '_Movies', attributes: ['id', 'title', 'poster_url'] }],
            },
            { booking: bookingIds },
        );
        const showtimesList: any[] = this._toList(showtimesRaw);
        if (showtimesList.length === 0)
            return { period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }, movies: [] };

        const ticketsRaw = await this._tickets.getAll(
            { count: false, attributes: ['id', 'booking', 'price'] },
            { booking: bookingIds },
        );
        const ticketsList: any[] = this._toList(ticketsRaw);

        // Capacidad por sala (batch)
        const seatCountMap = new Map<number, number>();
        await Promise.all(
            roomIds.map(async (rid: number) => {
                seatCountMap.set(rid, await this._seats.count({ room: rid }));
            }),
        );

        // Tickets por booking
        const ticketsByBooking = new Map<number, any[]>();
        for (const t of ticketsList) {
            if (!ticketsByBooking.has(t.booking)) ticketsByBooking.set(t.booking, []);
            ticketsByBooking.get(t.booking)!.push(t);
        }

        type MovieStats = {
            id: number;
            title: string;
            poster_url: string | null;
            showtimes: number;
            tickets_sold: number;
            revenue: number;
            total_capacity: number;
        };
        const movieMap = new Map<number, MovieStats>();

        for (const s of showtimesList) {
            if (!movieMap.has(s.movie)) {
                movieMap.set(s.movie, {
                    id: s.movie,
                    title: s._Movies?.title ?? `Movie ${s.movie}`,
                    poster_url: s._Movies?.poster_url ?? null,
                    showtimes: 0,
                    tickets_sold: 0,
                    revenue: 0,
                    total_capacity: 0,
                });
            }
            const stats = movieMap.get(s.movie)!;
            const roomId = bookingMap.get(s.booking)?.room;
            stats.showtimes += 1;
            stats.total_capacity += seatCountMap.get(roomId) ?? 0;
            const tickets = ticketsByBooking.get(s.booking) ?? [];
            stats.tickets_sold += tickets.length;
            stats.revenue += tickets.reduce((sum: number, t: any) => sum + Number(t.price), 0);
        }

        const movies = [...movieMap.values()]
            .map((m) => ({
                movie: { id: m.id, title: m.title, poster_url: m.poster_url },
                total_showtimes: m.showtimes,
                total_tickets_sold: m.tickets_sold,
                total_revenue: Math.round(m.revenue * 100) / 100,
                avg_occupancy_pct:
                    m.total_capacity > 0 ? Math.round((m.tickets_sold / m.total_capacity) * 10000) / 100 : 0,
            }))
            .sort((a, b) => b.total_tickets_sold - a.total_tickets_sold);

        return { period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }, movies };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. INVENTARIO
    // ─────────────────────────────────────────────────────────────────────────

    async getInventoryReport(cinemaId: number, filters: { from?: string; to?: string } = {}) {
        const { from, to } = this._buildDateRange(filters.from, filters.to);

        const inventoriesRaw = await this._inventories.getAll(
            {
                count: false,
                attributes: ['id', 'product', 'stock', 'minimum_stock'],
                relations: [
                    {
                        association: '_Products',
                        attributes: ['id', 'name', 'sku'],
                        include: [{ association: '_ProductCategories', attributes: ['id', 'description'] }],
                    },
                ],
            },
            { cinema: cinemaId },
        );
        const inventories: any[] = this._toList(inventoriesRaw);
        if (inventories.length === 0)
            return {
                period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
                products: [],
                alerts: [],
            };

        const inventoryIds = inventories.map((i: any) => i.id);

        const movementsRaw = await this._inventoryMovements.getAll(
            { count: false, attributes: ['id', 'inventory', 'operation_type', 'quantity'] },
            { inventory: inventoryIds, created_at: { [Ops.between]: [from, to] } },
        );
        const movements: any[] = this._toList(movementsRaw);

        const soldByInv = new Map<number, number>();
        const entriesByInv = new Map<number, number>();
        for (const m of movements) {
            const qty = Number(m.quantity);
            if (m.operation_type === INVENTORY_OP_SALE)
                soldByInv.set(m.inventory, (soldByInv.get(m.inventory) ?? 0) + qty);
            if (m.operation_type === INVENTORY_OP_ENTRY)
                entriesByInv.set(m.inventory, (entriesByInv.get(m.inventory) ?? 0) + qty);
        }

        const products = inventories
            .map((inv: any) => ({
                inventory_id: inv.id,
                product: {
                    id: inv._Products?.id ?? inv.product,
                    name: inv._Products?.name ?? `Product ${inv.product}`,
                    sku: inv._Products?.sku ?? null,
                    category: inv._Products?._ProductCategories ?? null,
                },
                current_stock: inv.stock,
                minimum_stock: inv.minimum_stock,
                units_sold: soldByInv.get(inv.id) ?? 0,
                units_received: entriesByInv.get(inv.id) ?? 0,
                below_minimum: inv.stock <= inv.minimum_stock,
            }))
            .sort((a, b) => Number(b.below_minimum) - Number(a.below_minimum));

        const alerts = products
            .filter((p) => p.below_minimum)
            .map((p) => ({ product: p.product, current_stock: p.current_stock, minimum_stock: p.minimum_stock }));

        return {
            period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
            products,
            alerts,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CAJA (CIERRE DE TURNO)
    // ─────────────────────────────────────────────────────────────────────────

    async getCashierReport(employeeId: number, cinemaId: number, filters: { from?: string; to?: string } = {}) {
        let dateFrom: Date;
        let dateTo: Date;

        if (filters.from || filters.to) {
            const r = this._buildDateRange(filters.from, filters.to);
            dateFrom = r.from;
            dateTo = r.to;
        } else {
            dateFrom = new Date();
            dateFrom.setUTCHours(0, 0, 0, 0);
            dateTo = new Date();
            dateTo.setUTCHours(23, 59, 59, 999);
        }

        const ordersRaw = await this._orders.getAll(
            {
                count: true,
                attributes: [
                    'id',
                    'subtotal_base_currency',
                    'tax_amount_base_currency',
                    'total_amount_base_currency',
                    'order_status',
                    'created_at',
                ],
                relations: [{ association: '_OrderStatuses', attributes: ['id', 'description'] }],
                order: [['created_at', 'ASC']],
            },
            { employee: employeeId, cinema: cinemaId, created_at: { [Ops.between]: [dateFrom, dateTo] } },
        );
        const orders: any[] = this._toList(ordersRaw);
        const totalOrders: number = Array.isArray(ordersRaw) ? orders.length : ordersRaw.count;

        if (orders.length === 0) {
            return {
                period: { from: dateFrom.toISOString().slice(0, 10), to: dateTo.toISOString().slice(0, 10) },
                employee_id: employeeId,
                summary: { total_orders: 0, total_revenue: 0, total_tax: 0 },
                breakdown_by_payment_method: [],
                transactions: [],
            };
        }

        const orderIds = orders.map((o: any) => o.id);
        const paymentsRaw = await this._orderPayments.getAll(
            {
                count: false,
                attributes: ['id', 'order', 'payment_method', 'amount', 'reference_number', 'created_at'],
                relations: [{ association: '_PaymentMethods', attributes: ['id', 'description'] }],
            },
            { order: orderIds, is_approved: true },
        );
        const payments: any[] = this._toList(paymentsRaw);

        const paidOrders = orders.filter((o: any) => PAID_STATUSES.includes(o.order_status));
        const totalRevenue = paidOrders.reduce((s: number, o: any) => s + Number(o.total_amount_base_currency), 0);
        const totalTax = paidOrders.reduce((s: number, o: any) => s + Number(o.tax_amount_base_currency), 0);

        const pmMap = new Map<number, { description: string; amount: number; count: number }>();
        for (const p of payments) {
            const id = p.payment_method;
            const desc = p._PaymentMethods?.description ?? `Método ${id}`;
            if (!pmMap.has(id)) pmMap.set(id, { description: desc, amount: 0, count: 0 });
            pmMap.get(id)!.amount += Number(p.amount);
            pmMap.get(id)!.count += 1;
        }
        const breakdown_by_payment_method = [...pmMap.entries()].map(([id, v]) => ({
            payment_method: { id, description: v.description },
            total_amount: Math.round(v.amount * 100) / 100,
            transaction_count: v.count,
        }));

        const transactions = orders.map((o: any) => ({
            order_id: o.id,
            created_at: o.created_at,
            status: o._OrderStatuses ?? { id: o.order_status },
            total: Number(o.total_amount_base_currency),
            payments: payments
                .filter((p: any) => p.order === o.id)
                .map((p: any) => ({
                    method: p._PaymentMethods ?? { id: p.payment_method },
                    amount: Number(p.amount),
                    reference: p.reference_number ?? null,
                })),
        }));

        return {
            period: { from: dateFrom.toISOString().slice(0, 10), to: dateTo.toISOString().slice(0, 10) },
            employee_id: employeeId,
            summary: {
                total_orders: totalOrders,
                total_revenue: Math.round(totalRevenue * 100) / 100,
                total_tax: Math.round(totalTax * 100) / 100,
            },
            breakdown_by_payment_method,
            transactions,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. FUNCIONES (OCUPACIÓN)
    // ─────────────────────────────────────────────────────────────────────────

    async getShowtimesReport(cinemaId: number, filters: { from?: string; to?: string } = {}) {
        const { from, to } = this._buildDateRange(filters.from, filters.to);

        const roomsRaw = await this._rooms.getAll({ count: false, attributes: ['id', 'name'] }, { cinema: cinemaId });
        const roomList: any[] = this._toList(roomsRaw);
        if (roomList.length === 0)
            return {
                period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
                showtimes: [],
            };

        const roomIds = roomList.map((r: any) => r.id);
        const roomMap = new Map<number, string>(roomList.map((r: any) => [r.id, r.name]));

        const bookingsRaw = await this._roomBookings.getAll(
            { count: false, attributes: ['id', 'room', 'start_time', 'end_time'] },
            { room: roomIds, start_time: { [Ops.between]: [from, to] } },
        );
        const bookings: any[] = this._toList(bookingsRaw);
        if (bookings.length === 0)
            return {
                period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
                showtimes: [],
            };

        const bookingIds = bookings.map((b: any) => b.id);
        const bookingMap = new Map<number, any>(bookings.map((b: any) => [b.id, b]));

        const [showtimesRaw, ticketsRaw] = await Promise.all([
            this._showtimes.getAll(
                {
                    count: false,
                    attributes: ['id', 'booking', 'movie'],
                    relations: [{ association: '_Movies', attributes: ['id', 'title'] }],
                },
                { booking: bookingIds },
            ),
            this._tickets.getAll({ count: false, attributes: ['id', 'booking', 'price'] }, { booking: bookingIds }),
        ]);

        const showtimesList: any[] = this._toList(showtimesRaw);
        const ticketsList: any[] = this._toList(ticketsRaw);

        const seatCountMap = new Map<number, number>();
        await Promise.all(
            roomIds.map(async (rid: number) => {
                seatCountMap.set(rid, await this._seats.count({ room: rid }));
            }),
        );

        const ticketsByBooking = new Map<number, any[]>();
        for (const t of ticketsList) {
            if (!ticketsByBooking.has(t.booking)) ticketsByBooking.set(t.booking, []);
            ticketsByBooking.get(t.booking)!.push(t);
        }

        const showtimes = showtimesList
            .map((s: any) => {
                const booking = bookingMap.get(s.booking) ?? {};
                const roomId = booking.room;
                const capacity = seatCountMap.get(roomId) ?? 0;
                const tickets = ticketsByBooking.get(s.booking) ?? [];
                const sold = tickets.length;
                const revenue = tickets.reduce((sum: number, t: any) => sum + Number(t.price), 0);
                return {
                    showtime_id: s.id,
                    booking_id: s.booking,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    movie: { id: s.movie, title: s._Movies?.title ?? `Movie ${s.movie}` },
                    room: { id: roomId, name: roomMap.get(roomId) ?? `Sala ${roomId}` },
                    capacity,
                    tickets_sold: sold,
                    occupancy_pct: capacity > 0 ? Math.round((sold / capacity) * 10000) / 100 : 0,
                    revenue: Math.round(revenue * 100) / 100,
                };
            })
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        return { period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }, showtimes };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. ALQUILERES
    // ─────────────────────────────────────────────────────────────────────────

    async getRentalsReport(cinemaId: number, filters: { from?: string; to?: string } = {}) {
        const { from, to } = this._buildDateRange(filters.from, filters.to);

        const roomsRaw = await this._rooms.getAll({ count: false, attributes: ['id'] }, { cinema: cinemaId });
        const roomIds: number[] = this._toList(roomsRaw).map((r: any) => r.id);

        const empty = {
            period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
            summary: { total_requests: 0, pending_review: 0, confirmed_revenue: 0, projected_revenue: 0 },
            breakdown_by_status: [],
            requests: [],
        };
        if (roomIds.length === 0) return empty;

        const rentalsRaw = await this._rentalRequests.getAll(
            {
                count: true,
                attributes: [
                    'id',
                    'room',
                    'event_name',
                    'event_date',
                    'requested_start_time',
                    'requested_end_time',
                    'status',
                    'price',
                    'currency',
                ],
                relations: [
                    { association: '_Statuses', attributes: ['id', 'description'] },
                    { association: '_Rooms', attributes: ['id', 'name'] },
                    { association: '_Currencies', attributes: ['id', 'code', 'symbol'], required: false },
                ],
                order: [['requested_start_time', 'ASC']],
            },
            { room: roomIds, requested_start_time: { [Ops.between]: [from, to] } },
        );

        const rentalsList: any[] = this._toList(rentalsRaw);
        const totalCount: number = Array.isArray(rentalsRaw) ? rentalsList.length : rentalsRaw.count;
        if (rentalsList.length === 0) return empty;

        type SStatusStats = { count: number; revenue: number; description: string };
        const byStatus = new Map<number, SStatusStats>();
        for (const r of rentalsList) {
            const sid = r.status;
            const desc = r._Statuses?.description ?? `Status ${sid}`;
            if (!byStatus.has(sid)) byStatus.set(sid, { count: 0, revenue: 0, description: desc });
            byStatus.get(sid)!.count += 1;
            byStatus.get(sid)!.revenue += Number(r.price ?? 0);
        }

        const breakdown_by_status = [...byStatus.entries()].map(([id, v]) => ({
            status: { id, description: v.description },
            count: v.count,
            revenue: Math.round(v.revenue * 100) / 100,
        }));

        return {
            period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
            summary: {
                total_requests: totalCount,
                pending_review: byStatus.get(RENTAL_STATUS_PENDING)?.count ?? 0,
                confirmed_revenue: Math.round((byStatus.get(RENTAL_STATUS_PAID)?.revenue ?? 0) * 100) / 100,
                projected_revenue: Math.round((byStatus.get(RENTAL_STATUS_PENDING_PMT)?.revenue ?? 0) * 100) / 100,
            },
            breakdown_by_status,
            requests: rentalsList.map((r: any) => ({
                id: r.id,
                event_name: r.event_name,
                event_date: r.event_date,
                requested_start_time: r.requested_start_time,
                requested_end_time: r.requested_end_time,
                room: r._Rooms ?? { id: r.room },
                status: r._Statuses ?? { id: r.status },
                price: r.price ?? null,
                currency: r._Currencies ?? (r.currency ? { id: r.currency } : null),
            })),
        };
    }
}

export default new ReportsManagementService();
