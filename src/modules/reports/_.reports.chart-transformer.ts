import type { ChartResponse, ChartDataset, PeriodRange } from './_.types.js';

// ── Tipos internos ────────────────────────────────────────────────────────────

type GroupBy = 'day' | 'week' | 'month';

interface GroupedBucket {
    label: string;
    items: any[];
}

// ── Transformer ───────────────────────────────────────────────────────────────

class ReportsChartTransformer {
    // ─── Utilidad: agrupación temporal ────────────────────────────────────────

    groupSeries(series: any[], groupBy: GroupBy, getDate: (item: any) => string): GroupedBucket[] {
        const buckets: Record<string, any[]> = {};

        for (const item of series) {
            const date = new Date(getDate(item));
            let key: string;

            if (groupBy === 'week') {
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay());
                key = startOfWeek.toISOString().slice(0, 10);
            } else if (groupBy === 'month') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                key = getDate(item).slice(0, 10);
            }

            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(item);
        }

        return Object.entries(buckets)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, items]) => ({ label, items }));
    }

    // ─── VENTAS ───────────────────────────────────────────────────────────────

    /**
     * Serie temporal de ingresos, órdenes y boletos.
     * Soporta agrupación por día / semana / mes.
     * Incluye desglose de pago y canal como datos adicionales para widgets.
     */
    salesChart(data: any, groupBy: GroupBy): ChartResponse {
        const series: any[] = data.daily_series ?? [];
        const grouped = this.groupSeries(series, groupBy, (i) => i.date);

        const datasets: ChartDataset[] = [
            {
                label: 'Ingresos',
                key: 'revenue',
                data: grouped.map((g) => ({
                    label: g.label,
                    value: g.items.reduce((s: number, i: any) => s + Number(i.revenue), 0),
                })),
            },
            {
                label: 'Órdenes',
                key: 'orders',
                data: grouped.map((g) => ({
                    label: g.label,
                    value: g.items.reduce((s: number, i: any) => s + Number(i.orders), 0),
                })),
            },
            {
                label: 'Boletos',
                key: 'tickets',
                data: grouped.map((g) => ({
                    label: g.label,
                    value: g.items.reduce((s: number, i: any) => s + Number(i.tickets), 0),
                })),
            },
        ];

        return {
            type: 'line',
            period: data.period as PeriodRange,
            groupBy,
            datasets,
            // Datos adicionales para widgets secundarios del dashboard
            payment_breakdown: (data.breakdown_by_payment_method ?? []).map((b: any) => ({
                label: b.payment_method?.description ?? 'Desconocido',
                value: Number(b.total_amount),
                count: Number(b.transaction_count),
            })),
            channel: data.channel ?? 'all',
            summary: data.summary ?? null,
        };
    }

    // ─── PELÍCULAS ────────────────────────────────────────────────────────────

    /**
     * Top 10 películas por ingresos.
     * Tres datasets paralelos: ingresos, boletos, ocupación.
     * El front puede elegir cuál dataset renderizar según el selector de métrica.
     */
    moviesChart(data: any): ChartResponse {
        const movies: any[] = [...(data.movies ?? [])].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 10);

        const datasets: ChartDataset[] = [
            {
                label: 'Ingresos por película',
                key: 'revenue',
                data: movies.map((m) => ({
                    label: m.movie.title,
                    value: Number(m.total_revenue),
                })),
            },
            {
                label: 'Boletos vendidos',
                key: 'tickets',
                data: movies.map((m) => ({
                    label: m.movie.title,
                    value: Number(m.total_tickets_sold),
                })),
            },
            {
                label: 'Ocupación promedio (%)',
                key: 'occupancy',
                data: movies.map((m) => ({
                    label: m.movie.title,
                    value: Number(m.avg_occupancy_pct),
                })),
            },
        ];

        return {
            type: 'bar',
            period: data.period as PeriodRange,
            datasets,
        };
    }

    // ─── EVENTOS ──────────────────────────────────────────────────────────────

    /**
     * Top 10 eventos especiales por ingresos.
     * Dos datasets: ingresos y boletos vendidos.
     */
    eventsChart(data: any): ChartResponse {
        const events: any[] = [...(data.events ?? [])].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 10);

        const datasets: ChartDataset[] = [
            {
                label: 'Ingresos por evento',
                key: 'revenue',
                data: events.map((e) => ({
                    label: e.event.title,
                    value: Number(e.total_revenue),
                })),
            },
            {
                label: 'Boletos vendidos',
                key: 'tickets',
                data: events.map((e) => ({
                    label: e.event.title,
                    value: Number(e.total_tickets_sold),
                })),
            },
        ];

        return {
            type: 'bar',
            period: data.period as PeriodRange,
            datasets,
        };
    }

    // ─── INVENTARIO ───────────────────────────────────────────────────────────

    /**
     * Top 10 productos por unidades vendidas.
     * Datasets: unidades vendidas y stock actual.
     * Incluye lista de alertas de stock bajo como dato adicional.
     */
    inventoryChart(data: any): ChartResponse {
        const products: any[] = [...(data.products ?? [])].sort((a, b) => b.units_sold - a.units_sold).slice(0, 10);

        const datasets: ChartDataset[] = [
            {
                label: 'Unidades vendidas',
                key: 'units_sold',
                data: products.map((p) => ({
                    label: p.product.name,
                    value: Number(p.units_sold),
                })),
            },
            {
                label: 'Stock actual',
                key: 'stock',
                data: products.map((p) => ({
                    label: p.product.name,
                    value: Number(p.current_stock),
                })),
            },
        ];

        const low_stock = (data.products ?? [])
            .filter((p: any) => p.current_stock <= p.minimum_stock)
            .map((p: any) => ({
                name: p.product.name,
                current: p.current_stock,
                minimum: p.minimum_stock,
            }));

        return {
            type: 'bar',
            period: data.period as PeriodRange,
            datasets,
            low_stock,
        };
    }

    // ─── FUNCIONES / OCUPACIÓN ────────────────────────────────────────────────

    /**
     * Ocupación y boletos agrupados por sala.
     * El dato `by_room` es útil para la tabla de detalle en el dashboard.
     */
    showtimesChart(data: any): ChartResponse {
        const showtimes: any[] = data.showtimes ?? [];

        const byRoom: Record<string, { tickets: number; capacity: number; count: number }> = {};
        for (const s of showtimes) {
            const room = s.room?.name ?? 'Sin sala';
            if (!byRoom[room]) byRoom[room] = { tickets: 0, capacity: 0, count: 0 };
            byRoom[room].tickets += Number(s.tickets_sold ?? 0);
            byRoom[room].capacity += Number(s.capacity ?? 0);
            byRoom[room].count += 1;
        }

        const roomData = Object.entries(byRoom).map(([name, v]) => ({
            label: name,
            occupancy_pct: v.capacity > 0 ? Number(((v.tickets / v.capacity) * 100).toFixed(2)) : 0,
            tickets_sold: v.tickets,
            showtimes_count: v.count,
        }));

        const datasets: ChartDataset[] = [
            {
                label: 'Ocupación por sala (%)',
                key: 'occupancy',
                data: roomData.map((r) => ({ label: r.label, value: r.occupancy_pct })),
            },
            {
                label: 'Boletos vendidos por sala',
                key: 'tickets',
                data: roomData.map((r) => ({ label: r.label, value: r.tickets_sold })),
            },
        ];

        return {
            type: 'bar',
            period: data.period as PeriodRange,
            datasets,
            by_room: roomData,
        };
    }

    // ─── ALQUILERES ───────────────────────────────────────────────────────────

    /**
     * Distribución de solicitudes por estado (pie chart).
     * Incluye summary consolidado como dato adicional.
     */
    rentalsChart(data: any): ChartResponse {
        const requests: any[] = data.requests ?? [];

        const byStatus: Record<string, number> = {};
        for (const r of requests) {
            const status = r.status?.description ?? 'Desconocido';
            byStatus[status] = (byStatus[status] ?? 0) + 1;
        }

        const datasets: ChartDataset[] = [
            {
                label: 'Solicitudes por estado',
                key: 'status',
                data: Object.entries(byStatus).map(([label, value]) => ({ label, value })),
            },
        ];

        return {
            type: 'pie',
            period: data.period as PeriodRange,
            datasets,
            summary: {
                total: requests.length,
                total_revenue: requests.reduce((s, r) => s + Number(r.price ?? 0), 0),
            },
        };
    }

    // ─── DASHBOARD SERIES ─────────────────────────────────────────────────────

    /**
     * Serie temporal condensada para el widget principal del dashboard.
     * Agrupa daily_series de ventas con el groupBy solicitado.
     */
    dashboardSeries(salesData: any, groupBy: GroupBy): ChartDataset[] {
        const series: any[] = salesData.daily_series ?? [];
        const grouped = this.groupSeries(series, groupBy, (i) => i.date);

        return [
            {
                label: 'Ingresos',
                key: 'revenue',
                data: grouped.map((g) => ({
                    label: g.label,
                    value: g.items.reduce((s: number, i: any) => s + Number(i.revenue), 0),
                })),
            },
            {
                label: 'Boletos',
                key: 'tickets',
                data: grouped.map((g) => ({
                    label: g.label,
                    value: g.items.reduce((s: number, i: any) => s + Number(i.tickets), 0),
                })),
            },
        ];
    }
}

export default new ReportsChartTransformer();
