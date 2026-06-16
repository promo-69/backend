import ReportsManagementService from '@services/reports-management.service.js';
import ReportsChartTransformer from './_.reports.chart-transformer.js';
import { ValidationError } from '@errors/index.js';

// ── Constantes de dominio ─────────────────────────────────────────────────────

const VALID_REPORT_TYPES = ['sales', 'movies', 'events', 'inventory', 'cashier', 'showtimes', 'rentals'] as const;
const VALID_FORMATS = ['json', 'csv', 'xlsx', 'pdf'] as const;
const VALID_GROUP_BY = ['day', 'week', 'month'] as const;

type ReportType = (typeof VALID_REPORT_TYPES)[number];
type GroupBy = (typeof VALID_GROUP_BY)[number];

// ── Interfaces públicas ───────────────────────────────────────────────────────

export interface ReportFilters {
    from?: string;
    to?: string;
    channel?: string;
}

export interface ChartFilters extends ReportFilters {
    groupBy?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

class ReportsModuleService {
    // ── Validaciones ──────────────────────────────────────────────────────────

    private _assertReportType(reportType: string): asserts reportType is ReportType {
        if (!VALID_REPORT_TYPES.includes(reportType as ReportType)) {
            throw new ValidationError(`Tipo de reporte inválido. Valores permitidos: ${VALID_REPORT_TYPES.join(', ')}`);
        }
    }

    private _assertFormat(format: string): void {
        if (!VALID_FORMATS.includes(format as any)) {
            throw new ValidationError(`Formato inválido. Valores permitidos: ${VALID_FORMATS.join(', ')}`);
        }
    }

    private _normalizeGroupBy(groupBy?: string): GroupBy {
        if (!groupBy || !VALID_GROUP_BY.includes(groupBy as GroupBy)) return 'day';
        return groupBy as GroupBy;
    }

    // ── Reportes individuales ─────────────────────────────────────────────────

    getSalesReport(cinemaId: number, filters: ReportFilters) {
        return ReportsManagementService.getSalesReport(cinemaId, filters);
    }

    getMoviesReport(cinemaId: number, filters: ReportFilters) {
        return ReportsManagementService.getMoviesReport(cinemaId, filters);
    }

    getEventsReport(cinemaId: number, filters: ReportFilters) {
        return ReportsManagementService.getEventsReport(cinemaId, filters);
    }

    getInventoryReport(cinemaId: number, filters: ReportFilters) {
        return ReportsManagementService.getInventoryReport(cinemaId, filters);
    }

    getShowtimesReport(cinemaId: number, filters: ReportFilters) {
        return ReportsManagementService.getShowtimesReport(cinemaId, filters);
    }

    getRentalsReport(cinemaId: number, filters: ReportFilters) {
        return ReportsManagementService.getRentalsReport(cinemaId, filters);
    }

    getCashierReport(employeeId: number, cinemaId: number, filters: ReportFilters) {
        if (!employeeId) throw new ValidationError('No se pudo determinar el empleado desde la sesión');
        return ReportsManagementService.getCashierReport(employeeId, cinemaId, filters);
    }

    // ── Export (punto único de entrada, validación centralizada) ──────────────

    async getReportForExport(reportType: string, format: string, cinemaId: number, filters: ReportFilters, employeeId?: number) {
        this._assertReportType(reportType);
        this._assertFormat(format);

        switch (reportType) {
            case 'sales':
                return this.getSalesReport(cinemaId, filters);
            case 'movies':
                return this.getMoviesReport(cinemaId, filters);
            case 'events':
                return this.getEventsReport(cinemaId, filters);
            case 'inventory':
                return this.getInventoryReport(cinemaId, filters);
            case 'cashier':
                if (!employeeId) throw new ValidationError('Se requiere employeeId para exportar reporte de caja');
                return this.getCashierReport(employeeId, cinemaId, filters);
            case 'showtimes':
                return this.getShowtimesReport(cinemaId, filters);
            case 'rentals':
                return this.getRentalsReport(cinemaId, filters);
        }
    }

    // ── Dashboard consolidado ─────────────────────────────────────────────────

    async getDashboardReport(cinemaId: number, filters: ReportFilters) {
        const [sales, movies, events, inventory, showtimes, rentals] = await Promise.all([
            ReportsManagementService.getSalesReport(cinemaId, filters),
            ReportsManagementService.getMoviesReport(cinemaId, filters),
            ReportsManagementService.getEventsReport(cinemaId, filters),
            ReportsManagementService.getInventoryReport(cinemaId, filters),
            ReportsManagementService.getShowtimesReport(cinemaId, filters),
            ReportsManagementService.getRentalsReport(cinemaId, filters),
        ]);

        const top_movies = (movies.movies ?? [])
            .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
            .slice(0, 5)
            .map((m: any) => ({
                id: m.movie.id,
                title: m.movie.title,
                total_tickets_sold: m.total_tickets_sold,
                total_revenue: m.total_revenue,
                avg_occupancy_pct: m.avg_occupancy_pct,
            }));

        const top_events = (events.events ?? [])
            .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
            .slice(0, 5)
            .map((e: any) => ({
                id: e.event.id,
                title: e.event.title,
                total_tickets_sold: e.total_tickets_sold,
                total_revenue: e.total_revenue,
            }));

        const showtimesList: any[] = showtimes.showtimes ?? [];
        const avg_occupancy_pct = showtimesList.length
            ? Number(
                  (
                      showtimesList.reduce((acc: number, s: any) => acc + Number(s.occupancy_pct ?? 0), 0) /
                      showtimesList.length
                  ).toFixed(2),
              )
            : 0;

        const low_stock_products = (inventory.products ?? [])
            .filter((p: any) => p.current_stock <= p.minimum_stock)
            .slice(0, 10)
            .map((p: any) => ({
                id: p.product.id,
                name: p.product.name,
                current_stock: p.current_stock,
                minimum_stock: p.minimum_stock,
            }));

        // Serie temporal para el widget principal del dashboard (agrupada por día por defecto)
        const daily_series = ReportsChartTransformer.dashboardSeries(sales, 'day');

        return {
            period: sales.period,
            kpis: {
                total_revenue: sales.summary?.total_revenue ?? 0,
                total_orders: sales.summary?.total_orders ?? 0,
                total_tickets: sales.summary?.total_tickets ?? 0,
                net_revenue: sales.summary?.net_revenue ?? 0,
                total_concessions_revenue: sales.summary?.total_concessions_revenue ?? 0,
                total_loyalty_points: sales.summary?.total_loyalty_points_generated ?? 0,
                avg_occupancy_pct,
                active_rentals: (rentals.requests ?? []).filter((r: any) => r.status?.id === 2).length,
                low_stock_alerts: low_stock_products.length,
            },
            daily_series,
            payment_breakdown: sales.breakdown_by_payment_method ?? [],
            top_movies,
            top_events,
            low_stock_products,
        };
    }

    // ── Chart data (dispatcher → ReportsChartTransformer) ─────────────────────

    async getChartData(cinemaId: number, reportType: string, filters: ChartFilters) {
        this._assertReportType(reportType);
        const groupBy = this._normalizeGroupBy(filters.groupBy);

        switch (reportType) {
            case 'sales': {
                const data = await ReportsManagementService.getSalesReport(cinemaId, filters);
                return ReportsChartTransformer.salesChart(data, groupBy);
            }
            case 'movies': {
                const data = await ReportsManagementService.getMoviesReport(cinemaId, filters);
                return ReportsChartTransformer.moviesChart(data);
            }
            case 'events': {
                const data = await ReportsManagementService.getEventsReport(cinemaId, filters);
                return ReportsChartTransformer.eventsChart(data);
            }
            case 'inventory': {
                const data = await ReportsManagementService.getInventoryReport(cinemaId, filters);
                return ReportsChartTransformer.inventoryChart(data);
            }
            case 'showtimes': {
                const data = await ReportsManagementService.getShowtimesReport(cinemaId, filters);
                return ReportsChartTransformer.showtimesChart(data);
            }
            case 'rentals': {
                const data = await ReportsManagementService.getRentalsReport(cinemaId, filters);
                return ReportsChartTransformer.rentalsChart(data);
            }
            case 'cashier':
                throw new ValidationError('El reporte de caja no dispone de vista de gráfico consolidado');
        }
    }
}

export default new ReportsModuleService();
