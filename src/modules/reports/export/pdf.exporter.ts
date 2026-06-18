import PDFDocument from 'pdfkit';
import {
    getReportColumns,
    getRowsByReportType,
    getNestedValue,
    getReportTitle,
    type Column,
} from './report-columns.js';

export class PDFExporter {
    static async toPDF(
        reportType: string,
        data: any,
        cinemaName?: string,
        companyName: string = 'Cineflix',
    ): Promise<Buffer> {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));

        // ── Membrete ──────────────────────────────────────────────────────────────
        // Empresa (izquierda)
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#231640').text(companyName, { align: 'left' });

        // Sucursal (derecha) - si existe
        if (cinemaName) {
            doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Sucursal: ${cinemaName}`, { align: 'right' });
        }
        doc.moveDown(0.5);

        // ── Título y período ──────────────────────────────────────────────────────
        const title = `Reporte de ${getReportTitle(reportType)}`;
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#231640').text(title, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#333333')
            .text(`Período: ${data.period?.from || '—'} - ${data.period?.to || '—'}`, { align: 'center' });
        doc.moveDown(1);

        // ── Obtener filas y columnas ─────────────────────────────────────────────
        const rows = getRowsByReportType(reportType, data);
        if (!rows || rows.length === 0) {
            doc.fontSize(12).text('No hay datos para el período seleccionado.', { align: 'center' });
            doc.end();
            return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
        }

        const columns = getReportColumns(reportType);
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const totalWidth = columns.reduce((sum, col) => sum + (col.width || 100), 0);
        const scaleFactor = pageWidth / totalWidth;

        // Ajustar anchos proporcionalmente
        const adjustedColumns: (Column & { width: number })[] = columns.map((col) => ({
            ...col,
            width: (col.width || 100) * scaleFactor,
        }));

        // ── Dibujar la tabla ──────────────────────────────────────────────────────
        const rowHeight = 16;
        const headerHeight = 18;
        let currentY = doc.y;

        const drawHeader = (yPos: number) => {
            let x = doc.page.margins.left;
            doc.rect(x, yPos, pageWidth, headerHeight).fill('#231640');
            adjustedColumns.forEach((col) => {
                doc.fillColor('#ffffff')
                    .fontSize(9)
                    .font('Helvetica-Bold')
                    .text(col.header, x + 4, yPos + 4, {
                        width: col.width - 8,
                        align: col.align === 'right' ? 'right' : 'left',
                    });
                doc.strokeColor('#ffffff').lineWidth(0.3);
                doc.moveTo(x + col.width, yPos)
                    .lineTo(x + col.width, yPos + headerHeight)
                    .stroke();
                x += col.width;
            });
            doc.strokeColor('#ffffff').lineWidth(0.5);
            doc.moveTo(doc.page.margins.left, yPos + headerHeight)
                .lineTo(doc.page.margins.left + pageWidth, yPos + headerHeight)
                .stroke();
        };

        const drawRow = (row: any, yPos: number, index: number) => {
            let x = doc.page.margins.left;
            // Fondo alternado
            if (index % 2 === 0) {
                doc.rect(x, yPos, pageWidth, rowHeight).fill('#f9f9f9');
            }
            adjustedColumns.forEach((col) => {
                const value = getNestedValue(row, col.key);
                const text = value !== undefined && value !== null ? String(value) : '—';
                doc.fillColor('#333333')
                    .fontSize(8)
                    .font('Helvetica')
                    .text(text, x + 4, yPos + 3, {
                        width: col.width - 8,
                        align: col.align === 'right' ? 'right' : 'left',
                        ellipsis: true,
                    });
                doc.strokeColor('#e0e0e0').lineWidth(0.2);
                doc.moveTo(x + col.width, yPos)
                    .lineTo(x + col.width, yPos + rowHeight)
                    .stroke();
                x += col.width;
            });
            doc.strokeColor('#e0e0e0').lineWidth(0.3);
            doc.moveTo(doc.page.margins.left, yPos + rowHeight)
                .lineTo(doc.page.margins.left + pageWidth, yPos + rowHeight)
                .stroke();
        };

        // ── Encabezado inicial ────────────────────────────────────────────────────
        drawHeader(currentY);
        currentY += headerHeight;

        // ── Filas ──────────────────────────────────────────────────────────────────
        let rowIndex = 0;
        for (const row of rows) {
            if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 20) {
                doc.addPage();
                currentY = doc.page.margins.top;
                drawHeader(currentY);
                currentY += headerHeight;
            }
            drawRow(row, currentY, rowIndex);
            currentY += rowHeight;
            rowIndex++;
        }

        // ── Totales / Resumen ─────────────────────────────────────────────────────
        const summary = this._getSummary(reportType, data);
        if (summary) {
            doc.moveDown(1);
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#231640');
            doc.text(summary, { align: 'right' });
        }

        // ── Pie de página ────────────────────────────────────────────────────────
        doc.moveDown(1);
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#999999')
            .text(`Generado el ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();
        return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
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
