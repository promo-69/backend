import ExcelJS from 'exceljs';
import { getReportColumns, getRowsByReportType, getNestedValue, getReportTitle } from './report-columns.js';

export class XLSXExporter {
    static async toXLSX(
        reportType: string,
        data: any,
        cinemaName?: string,
        companyName: string = 'Cineflix',
    ): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(reportType.toUpperCase());

        const columns = getReportColumns(reportType);
        const rows = getRowsByReportType(reportType, data);

        // ── Membrete ──────────────────────────────────────────────────────────────
        // Fila 1: Empresa y sucursal (combinando celdas)
        const headerRow1 = worksheet.getRow(1);
        headerRow1.height = 24;
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `${companyName}${cinemaName ? ` - Sucursal: ${cinemaName}` : ''}`;
        titleCell.font = { bold: true, size: 14, color: { argb: '231640' } };
        // Combinar celdas A1 hasta la última columna
        const lastCol = columns.length;
        worksheet.mergeCells(1, 1, 1, lastCol);

        // Fila 2: Título del reporte
        const headerRow2 = worksheet.getRow(2);
        headerRow2.height = 20;
        const titleCell2 = worksheet.getCell('A2');
        titleCell2.value = `Reporte de ${getReportTitle(reportType)}`;
        titleCell2.font = { bold: true, size: 12, color: { argb: '231640' } };
        worksheet.mergeCells(2, 1, 2, lastCol);

        // Fila 3: Período
        const headerRow3 = worksheet.getRow(3);
        headerRow3.height = 18;
        const periodCell = worksheet.getCell('A3');
        periodCell.value = `Período: ${data.period?.from || '—'} - ${data.period?.to || '—'}`;
        periodCell.font = { size: 10, color: { argb: '666666' } };
        worksheet.mergeCells(3, 1, 3, lastCol);

        // ── Salto de fila ─────────────────────────────────────────────────────────
        // Dejamos la fila 4 vacía (separador)
        worksheet.getRow(4).height = 8;

        // ── Cabeceras de la tabla (fila 5) ──────────────────────────────────────
        const headerRow = worksheet.getRow(5);
        headerRow.height = 22;
        for (let i = 0; i < columns.length; i++) {
            const cell = headerRow.getCell(i + 1);
            cell.value = columns[i].header;
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '231640' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin', color: { argb: '231640' } },
                bottom: { style: 'thin', color: { argb: '231640' } },
                left: { style: 'thin', color: { argb: '231640' } },
                right: { style: 'thin', color: { argb: '231640' } },
            };
        }

        // ── Datos ──────────────────────────────────────────────────────────────────
        if (!rows || rows.length === 0) {
            // Sin datos: mensaje centrado
            const emptyRow = worksheet.getRow(6);
            const cell = emptyRow.getCell(1);
            cell.value = 'No hay datos para el período seleccionado.';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(6, 1, 6, lastCol);
            emptyRow.height = 30;
        } else {
            for (let r = 0; r < rows.length; r++) {
                const row = rows[r];
                const excelRow = worksheet.getRow(r + 6);
                excelRow.height = 18;
                for (let c = 0; c < columns.length; c++) {
                    const col = columns[c];
                    const value = getNestedValue(row, col.key);
                    const cell = excelRow.getCell(c + 1);
                    cell.value = value !== undefined && value !== null ? value : '—';
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: col.align === 'right' ? 'right' : 'left',
                    };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'E0E0E0' } },
                        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
                        left: { style: 'thin', color: { argb: 'E0E0E0' } },
                        right: { style: 'thin', color: { argb: 'E0E0E0' } },
                    };
                }
                // Fondo alternado
                if (r % 2 === 1) {
                    excelRow.eachCell((cell) => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
                    });
                }
            }

            // ── Totales ──────────────────────────────────────────────────────────────
            const summary = this._getSummary(reportType, data);
            if (summary) {
                const totalRow = worksheet.getRow(rows.length + 6);
                totalRow.height = 20;
                const cell = totalRow.getCell(1);
                cell.value = summary;
                cell.font = { bold: true, size: 10, color: { argb: '231640' } };
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                worksheet.mergeCells(rows.length + 6, 1, rows.length + 6, lastCol);
            }
        }

        // ── Ajustar ancho de columnas ─────────────────────────────────────────────
        worksheet.columns.forEach((col, index) => {
            if (columns[index]?.width) {
                col.width = Math.max(columns[index].width / 7, 12);
            } else {
                col.width = 15;
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
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
