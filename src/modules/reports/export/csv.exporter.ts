import { getReportColumns, getRowsByReportType, getNestedValue, getReportTitle } from './report-columns.js';

export class CSVExporter {
    static toCSV(reportType: string, data: any, cinemaName?: string, companyName: string = 'Cineflix'): string {
        const columns = getReportColumns(reportType);
        const rows = getRowsByReportType(reportType, data);
        const lines: string[] = [];

        // ── Membrete ──────────────────────────────────────────────────────────────
        lines.push(`"${companyName}${cinemaName ? ` - Sucursal: ${cinemaName}` : ''}"`);
        lines.push(`"Reporte de ${getReportTitle(reportType)}"`);
        lines.push(`"Período: ${data.period?.from || '—'} - ${data.period?.to || '—'}"`);
        lines.push(''); // línea en blanco

        // ── Cabeceras ─────────────────────────────────────────────────────────────
        const headers = columns.map((col) => `"${col.header}"`);
        lines.push(headers.join(','));

        // ── Datos ──────────────────────────────────────────────────────────────────
        if (!rows || rows.length === 0) {
            lines.push('"No hay datos para el período seleccionado."');
        } else {
            for (const row of rows) {
                const rowData = columns.map((col) => {
                    const value = getNestedValue(row, col.key);
                    const text = value !== undefined && value !== null ? String(value) : '—';
                    return `"${text.replace(/"/g, '""')}"`;
                });
                lines.push(rowData.join(','));
            }

            // ── Totales ──────────────────────────────────────────────────────────────
            const summary = this._getSummary(reportType, data);
            if (summary) {
                lines.push(''); // línea en blanco
                lines.push(`"${summary}"`);
            }
        }

        return lines.join('\n');
    }

    private static _getSummary(reportType: string, data: any): string | null {
        if (reportType === 'sales' && data.summary) {
            const s = data.summary;
            return `Total órdenes: ${s.total_orders}  |  Ingresos: $${s.total_revenue?.toFixed(2) || '0.00'}  |  Boletos: ${s.total_tickets}`;
        }
        if (reportType === 'movies' && data.movies?.length) {
            const totalRevenue = data.movies.reduce((acc: number, m: any) => acc + Number(m.total_revenue || 0), 0);
            return `Ingresos totales: $${totalRevenue.toFixed(2)}  |  Películas: ${data.movies.length}`;
        }
        if (reportType === 'inventory' && data.products?.length) {
            const totalValue = data.products.reduce((acc: number, p: any) => acc + Number(p.stock_value || 0), 0);
            const totalSold = data.products.reduce((acc: number, p: any) => acc + Number(p.units_sold || 0), 0);
            return `Valor total stock: $${totalValue.toFixed(2)}  |  Unidades vendidas: ${totalSold}`;
        }
        if (reportType === 'cashier' && data.summary) {
            const s = data.summary;
            return `Total ingresos: $${s.total_revenue?.toFixed(2) || '0.00'}  |  Órdenes: ${s.total_orders}  |  Canceladas: ${s.cancelled_orders || 0}`;
        }
        return null;
    }
}
