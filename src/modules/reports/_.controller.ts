import { ControllerBase } from '@bases/controller.base.js';
import { ValidationError } from '@errors/index.js';
import ReportsService from './_.service.js';
import { CSVExporter } from './export/csv.exporter.js';
import { XLSXExporter } from './export/xlsx.exporter.js';
import { PDFExporter } from './export/pdf.exporter.js';

class ReportsController extends ControllerBase {
    private _session() { return this.getSession<any>(); }
    private _query() { return this.getQuery(); }
    private _params() { return this.getParams(); }
    private _cinemaId(): number { return Number(this._session()?.cinemaId); }
    private _dateFilters() {
        const q = this._query();
        return { from: q.from as string | undefined, to: q.to as string | undefined };
    }

    // ---------- Dashboard consolidado ----------
    async getDashboard() {
        const data = await ReportsService.getDashboardReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Dashboard generado exitosamente');
    }
    async getDashboardByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getDashboardReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Dashboard generado exitosamente');
    }

    // ---------- Charts ----------
    async getChart() {
        const { reportType } = this._params();
        const q = this._query();
        const data = await ReportsService.getChartData(this._cinemaId(), reportType, {
            ...this._dateFilters(),
            groupBy: q.groupBy as string | undefined,
            channel: q.channel as string | undefined,
        });
        return this.success(data, 'Datos de gráfico generados exitosamente');
    }
    async getChartByCinema() {
        const { cinemaId, reportType } = this._params();
        const q = this._query();
        const data = await ReportsService.getChartData(Number(cinemaId), reportType, {
            ...this._dateFilters(),
            groupBy: q.groupBy as string | undefined,
            channel: q.channel as string | undefined,
        });
        return this.success(data, 'Datos de gráfico generados exitosamente');
    }

    // ---------- Rutas de empleado (cinemaId implícito) ----------
    async getSales() {
        const q = this._query();
        const data = await ReportsService.getSalesReport(this._cinemaId(), {
            ...this._dateFilters(),
            channel: q.channel as string | undefined,
        });
        return this.success(data, 'Reporte de ventas generado exitosamente');
    }
    async getMovies() {
        const data = await ReportsService.getMoviesReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de películas generado exitosamente');
    }
    async getEvents() {
        const data = await ReportsService.getEventsReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de eventos especiales generado exitosamente');
    }
    async getInventory() {
        const data = await ReportsService.getInventoryReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de inventario generado exitosamente');
    }
    async getCashier() {
        const session = this._session();
        const employeeId = Number(session?.employeeId ?? session?.userId);
        const data = await ReportsService.getCashierReport(employeeId, this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de caja generado exitosamente');
    }
    async getShowtimes() {
        const data = await ReportsService.getShowtimesReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de funciones generado exitosamente');
    }
    async getRentals() {
        const data = await ReportsService.getRentalsReport(this._cinemaId(), this._dateFilters());
        return this.success(data, 'Reporte de alquileres generado exitosamente');
    }

    // ---------- Rutas para superadmin (cinemaId en URL) ----------
    async getSalesByCinema() {
        const { cinemaId } = this._params();
        const q = this._query();
        const data = await ReportsService.getSalesReport(Number(cinemaId), {
            ...this._dateFilters(),
            channel: q.channel as string | undefined,
        });
        return this.success(data, 'Reporte de ventas generado exitosamente');
    }
    async getMoviesByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getMoviesReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de películas generado exitosamente');
    }
    async getEventsByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getEventsReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de eventos especiales generado exitosamente');
    }
    async getInventoryByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getInventoryReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de inventario generado exitosamente');
    }
    async getShowtimesByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getShowtimesReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de funciones generado exitosamente');
    }
    async getRentalsByCinema() {
        const { cinemaId } = this._params();
        const data = await ReportsService.getRentalsReport(Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de alquileres generado exitosamente');
    }
    async getCashierByCinema() {
        const { cinemaId, employeeId } = this._params();
        const data = await ReportsService.getCashierReport(Number(employeeId), Number(cinemaId), this._dateFilters());
        return this.success(data, 'Reporte de caja generado exitosamente');
    }

    // ---------- Exportación empleado (cinemaId del JWT) ----------
    async export() {
        const { reportType } = this._params();
        const q = this._query();
        const format = (q.format as string | undefined) ?? 'json';
        const session = this._session();
        const cinemaId = this._cinemaId();

        // La validación de reportType y format vive en el service
        const reportData = await ReportsService.getReportForExport(
            reportType,
            format,
            cinemaId,
            { ...this._dateFilters(), channel: q.channel as string | undefined },
            Number(session?.employeeId ?? session?.userId),
        );

        return this._sendExport(reportType, format, reportData);
    }

    // ---------- Exportación superadmin (cinemaId en URL) ----------
    async exportByCinema() {
        const { cinemaId, reportType } = this._params();
        const q = this._query();
        const format = (q.format as string | undefined) ?? 'json';
        const employeeId = q.employeeId ? Number(q.employeeId) : undefined;

        const reportData = await ReportsService.getReportForExport(
            reportType,
            format,
            Number(cinemaId),
            { ...this._dateFilters(), channel: q.channel as string | undefined },
            employeeId,
        );

        return this._sendExport(reportType, format, reportData);
    }

    // ---------- Helper interno de respuesta de export ----------
    private async _sendExport(reportType: string, format: string, reportData: any) {
        if (format === 'json') {
            return this.success(reportData, `Reporte ${reportType} exportado`);
        }

        if (format === 'csv') {
            const csv = CSVExporter.toCSV(reportType, reportData);
            this.getResponse().setHeader('Content-Type', 'text/csv');
            this.getResponse().setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
            this.getResponse().send(csv);
            return;
        }

        if (format === 'xlsx') {
            const buffer = await XLSXExporter.toXLSX(reportType, reportData);
            this.getResponse().setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            this.getResponse().setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
            this.getResponse().send(buffer);
            return;
        }

        if (format === 'pdf') {
            const pdfBuffer = await PDFExporter.toPDF(reportType, reportData);
            this.getResponse().setHeader('Content-Type', 'application/pdf');
            this.getResponse().setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
            this.getResponse().send(pdfBuffer);
            return;
        }

        // Nunca llega aquí: el service ya validó el formato
        throw new ValidationError(`Formato inválido: ${format}`);
    }
}

export default new ReportsController();
