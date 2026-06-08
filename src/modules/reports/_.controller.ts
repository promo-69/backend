import { ControllerBase } from '@bases/controller.base.js';
import ReportsService from './_.service.js';

class ReportsController extends ControllerBase {
    private _session() {
        return this.getSession<any>();
    }
    private _query() {
        return this.getQuery();
    }
    private _params() {
        return this.getParams();
    }

    private _cinemaId(): number {
        const session = this._session();
        // El cinemaId implícito viene del JWT del empleado
        return Number(session?.cinemaId);
    }

    private _dateFilters() {
        const q = this._query();
        return {
            from: q.from as string | undefined,
            to: q.to as string | undefined,
        };
    }

    // GET /reports/sales
    async getSales() {
        const q = this._query();
        const data = await ReportsService.getSalesReport(this._cinemaId(), {
            ...this._dateFilters(),
            channel: q.channel as string | undefined,
        });
        return this.success(data, 'Reporte de ventas generado exitosamente');
    }

    // GET /reports/movies
    async getMovies() {
        const data = await ReportsService.getMoviesReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de películas generado exitosamente');
    }

    // GET /reports/inventory
    async getInventory() {
        const data = await ReportsService.getInventoryReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de inventario generado exitosamente');
    }

    // GET /reports/cashier
    async getCashier() {
        const session = this._session();
        const employeeId = Number(session?.employeeId ?? session?.userId);
        const data = await ReportsService.getCashierReport(employeeId, this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de caja generado exitosamente');
    }

    // GET /reports/showtimes
    async getShowtimes() {
        const data = await ReportsService.getShowtimesReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de funciones generado exitosamente');
    }

    // GET /reports/rentals
    async getRentals() {
        const data = await ReportsService.getRentalsReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de alquileres generado exitosamente');
    }

    // GET /reports/cinemas/:cinemaId/sales
    async getSalesByCinema() {
        const { cinemaId } = this._params();
        const q = this._query();
        const data = await ReportsService.getSalesReport(Number(cinemaId), {
            ...this._dateFilters(),
            channel: q.channel as string | undefined,
        });
        return this.success(data, 'Reporte de ventas generado exitosamente');
    }

    // GET /reports/cinemas/:cinemaId/movies
    async getMoviesByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getMoviesReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de películas generado exitosamente');
    }

    // GET /reports/cinemas/:cinemaId/inventory
    async getInventoryByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getInventoryReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de inventario generado exitosamente');
    }

    // GET /reports/cinemas/:cinemaId/showtimes
    async getShowtimesByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getShowtimesReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de funciones generado exitosamente');
    }

    // GET /reports/cinemas/:cinemaId/rentals
    async getRentalsByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getRentalsReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de alquileres generado exitosamente');
    }

    // GET /reports/cinemas/:cinemaId/cashier/:employeeId
    async getCashierByCinema() {
        const { cinemaId, employeeId } = this._params();
        const data = await ReportsService.getCashierReport(Number(employeeId), Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de caja generado exitosamente');
    }

    // GET /reports/:reportType/export
    async export() {
        const { reportType } = this._params();
        const q = this._query();
        const format = (q.format as string | undefined) ?? 'json';
        const session = this._session();
        const cinemaId = this._cinemaId();

        const validTypes = ['sales', 'movies', 'inventory', 'cashier', 'showtimes', 'rentals'];
        if (!validTypes.includes(reportType)) {
            const { ValidationError } = await import('@errors/index.js');
            throw new ValidationError(`Tipo de reporte inválido. Valores permitidos: ${validTypes.join(', ')}`);
        }

        const validFormats = ['json', 'csv', 'pdf'];
        if (!validFormats.includes(format)) {
            const { ValidationError } = await import('@errors/index.js');
            throw new ValidationError(`Formato inválido. Valores permitidos: ${validFormats.join(', ')}`);
        }

        const filters = { ...this._dateFilters(), channel: q.channel as string | undefined };

        let reportData: any;
        if (reportType === 'sales') reportData = await ReportsService.getSalesReport(cinemaId, filters);
        else if (reportType === 'movies') reportData = await ReportsService.getMoviesReport(cinemaId, filters);
        else if (reportType === 'inventory') reportData = await ReportsService.getInventoryReport(cinemaId, filters);
        else if (reportType === 'cashier')
            reportData = await ReportsService.getCashierReport(
                Number(session?.employeeId ?? session?.userId),
                cinemaId,
                filters,
            );
        else if (reportType === 'showtimes') reportData = await ReportsService.getShowtimesReport(cinemaId, filters);
        else reportData = await ReportsService.getRentalsReport(cinemaId, filters);

        if (format === 'json') {
            return this.success(reportData, `Reporte ${reportType} exportado`);
        }

        if (format === 'csv') {
            const csv = this._toCSV(reportType, reportData);
            this.getResponse().setHeader('Content-Type', 'text/csv');
            this.getResponse().setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
            this.getResponse().send(csv);
            return;
        }

        // format === 'pdf' — placeholder hasta integrar librería PDF
        this.getResponse().setHeader('Content-Type', 'application/json');
        return this.success(
            { ...reportData, _note: 'PDF export requiere librería PDF (pdfkit/puppeteer). Actualmente devuelve JSON.' },
            `Reporte ${reportType}`,
        );
    }

    /** Convierte los datos del reporte en CSV simple */
    private _toCSV(reportType: string, data: any): string {
        const rows: any[] = (() => {
            if (reportType === 'sales') return data.daily_series ?? [];
            if (reportType === 'movies') return data.movies ?? [];
            if (reportType === 'inventory') return data.products ?? [];
            if (reportType === 'cashier') return data.transactions ?? [];
            if (reportType === 'showtimes') return data.showtimes ?? [];
            if (reportType === 'rentals') return data.requests ?? [];
            return [];
        })();

        if (rows.length === 0) return 'no_data\n';

        const flatten = (obj: any, prefix = ''): Record<string, string> => {
            return Object.keys(obj).reduce((acc: any, key) => {
                const val = obj[key];
                const pKey = prefix ? `${prefix}.${key}` : key;
                if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                    Object.assign(acc, flatten(val, pKey));
                } else if (!Array.isArray(val)) {
                    acc[pKey] = String(val ?? '');
                }
                return acc;
            }, {});
        };

        const flatRows = rows.map((r: any) => flatten(r));
        const headers = [...new Set(flatRows.flatMap(Object.keys))];
        const csvHeader = headers.join(',');
        const csvRows = flatRows.map((r: any) => headers.map((h) => `"${(r[h] ?? '').replace(/"/g, '""')}"`).join(','));

        return [csvHeader, ...csvRows].join('\n');
    }
}

export default new ReportsController();
