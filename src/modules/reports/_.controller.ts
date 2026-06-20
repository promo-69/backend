import { ControllerBase } from '@bases/controller.base.js';
import { Database } from '@database/index.js';
import { ValidationError } from '@errors/index.js';
import ReportsService from './_.service.js';
import { CSVExporter } from './export/csv.exporter.js';
import { XLSXExporter } from './export/xlsx.exporter.js';
import { PDFExporter } from './export/pdf.exporter.js';

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

    private _dateFilters() {
        const q = this._query();
        return { from: q.from as string | undefined, to: q.to as string | undefined };
    }

    /**
     * Resuelve el cinemaId con la siguiente prioridad:
     *   1. ?cinemaId=X en query (superadmin seleccionando sede explícita)
     *   2. cinemaId del JWT (empleado anclado a su sede)
     *   3. undefined → el management service no filtra por sede (vista global)
     *
     * El permiso REPORTS-ALL en el middleware garantiza que solo superadmin
     * pueda enviar ?cinemaId; un empleado sin ese permiso nunca llega con él.
     */
    private _resolveCinemaId(): number | undefined {
        const q = this._query();
        if (q.cinemaId) return Number(q.cinemaId);
        const sessionCinemaId = this._session()?.cinemaId;
        return sessionCinemaId ? Number(sessionCinemaId) : undefined;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    async getDashboard() {
        const cinemaId = this._resolveCinemaId();
        const data = await ReportsService.getDashboardReport(cinemaId, this._dateFilters());
        return this.success(data, 'Dashboard generado exitosamente');
    }

    // ── Charts ────────────────────────────────────────────────────────────────
    async getChart() {
        const { reportType } = this._params();
        const q = this._query();
        const cinemaId = this._resolveCinemaId();
        const data = await ReportsService.getChartData(cinemaId, reportType, {
            ...this._dateFilters(),
            groupBy: q.groupBy as string | undefined,
            channel: q.channel as string | undefined,
        });
        return this.success(data, 'Datos de gráfico generados exitosamente');
    }

    // ── Reportes individuales ─────────────────────────────────────────────────
    async getSales() {
        const q = this._query();
        const data = await ReportsService.getSalesReport(this._resolveCinemaId(), {
            ...this._dateFilters(),
            channel: q.channel as string | undefined,
        });
        return this.success(data, 'Reporte de ventas generado exitosamente');
    }
    async getMovies() {
        const data = await ReportsService.getMoviesReport(this._resolveCinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de películas generado exitosamente');
    }
    async getEvents() {
        const data = await ReportsService.getEventsReport(this._resolveCinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de eventos especiales generado exitosamente');
    }
    async getInventory() {
        const data = await ReportsService.getInventoryReport(this._resolveCinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de inventario generado exitosamente');
    }
    async getCashier() {
        const session = this._session();
        const employeeId = Number(session?.employeeId ?? session?.userId);
        const data = await ReportsService.getCashierReport(employeeId, this._resolveCinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de caja generado exitosamente');
    }
    async getShowtimes() {
        const data = await ReportsService.getShowtimesReport(this._resolveCinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de funciones generado exitosamente');
    }
    async getRentals() {
        const data = await ReportsService.getRentalsReport(this._resolveCinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de alquileres generado exitosamente');
    }

    // ── Exportación ───────────────────────────────────────────────────────────
    async export() {
        const { reportType } = this._params();
        const q = this._query();
        const format = (q.format as string | undefined) ?? 'json';
        const session = this._session();
        const cinemaId = this._resolveCinemaId();
        const employeeId = q.employeeId ? Number(q.employeeId) : Number(session?.employeeId ?? session?.userId);

        const reportData = await ReportsService.getReportForExport(
            reportType,
            format,
            cinemaId,
            { ...this._dateFilters(), channel: q.channel as string | undefined },
            employeeId,
        );

        return this._sendExport(reportType, format, reportData);
    }

    // ── Helper de respuesta binaria ───────────────────────────────────────────
    private async _sendExport(reportType: string, format: string, reportData: any, cinemaId?: number) {
        // ── Obtener nombre de la sucursal (si existe) ──────────────────────────
        let cinemaName: string | undefined;
        if (cinemaId) {
            const cinemasRepo = Database.repository('main', 'cinemas') as any;
            const cinema = await cinemasRepo.getById(cinemaId, { attributes: ['name'] });
            cinemaName = cinema?.name;
        }

        if (format === 'json') {
            return this.success(reportData, `Reporte ${reportType} exportado`);
        }
        if (format === 'csv') {
            const csv = CSVExporter.toCSV(reportType, reportData, cinemaName);
            this.getResponse().setHeader('Content-Type', 'text/csv');
            this.getResponse().setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
            this.getResponse().send(csv);
            return;
        }
        if (format === 'xlsx') {
            const buffer = await XLSXExporter.toXLSX(reportType, reportData, cinemaName);
            this.getResponse().setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            this.getResponse().setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
            this.getResponse().send(buffer);
            return;
        }
        if (format === 'pdf') {
            const pdfBuffer = await PDFExporter.toPDF(reportType, reportData, cinemaName);
            this.getResponse().setHeader('Content-Type', 'application/pdf');
            this.getResponse().setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
            this.getResponse().send(pdfBuffer);
            return;
        }
        throw new ValidationError(`Formato inválido: ${format}`);
    }
}

export default new ReportsController();
