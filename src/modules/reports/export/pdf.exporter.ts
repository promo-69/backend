import PDFDocument from 'pdfkit';

export class PDFExporter {
    static async toPDF(reportType: string, data: any): Promise<Buffer> {
        const doc = new PDFDocument({ margin: 30 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));

        doc.fontSize(18).text(`Reporte de ${reportType.toUpperCase()}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Período: ${data.period?.from} - ${data.period?.to}`, { align: 'center' });
        doc.moveDown(2);

        let rows: any[] = [];
        if (reportType === 'sales') rows = data.daily_series ?? [];
        else if (reportType === 'movies') rows = data.movies ?? [];
        else if (reportType === 'events') rows = data.events ?? [];
        else if (reportType === 'inventory') rows = data.products ?? [];
        else if (reportType === 'cashier') rows = data.transactions ?? [];
        else if (reportType === 'showtimes') rows = data.showtimes ?? [];
        else if (reportType === 'rentals') rows = data.requests ?? [];

        if (rows.length === 0) {
            doc.text('No hay datos para el período seleccionado.');
        } else {
            const displayRows = rows.slice(0, 20);
            let currentY = doc.y;
            const rowHeight = 20;
            const pageHeight = doc.page.height - doc.page.margins.bottom;

            for (let i = 0; i < displayRows.length; i++) {
                if (currentY + rowHeight > pageHeight) {
                    doc.addPage();
                    currentY = doc.page.margins.top;
                }
                const row = displayRows[i];
                let line = '';
                if (reportType === 'sales') {
                    line = `${row.date} | Órdenes: ${row.orders} | Boletos: ${row.tickets} | Ingresos: ${row.revenue}`;
                } else if (reportType === 'movies') {
                    line = `${row.movie.title} | Boletos: ${row.total_tickets_sold} | Ingresos: ${row.total_revenue} | Ocupación: ${row.avg_occupancy_pct}%`;
                } else if (reportType === 'events') {
                    line = `${row.event.title} | Boletos: ${row.total_tickets_sold} | Ingresos: ${row.total_revenue} | Ocupación: ${row.avg_occupancy_pct}%`;
                } else if (reportType === 'inventory') {
                    line = `${row.product.name} | Stock: ${row.current_stock} | Vendidos: ${row.units_sold} | Valor: ${row.stock_value}`;
                } else if (reportType === 'cashier') {
                    line = `Orden ${row.order_id} | ${new Date(row.created_at).toLocaleString()} | Total: ${row.total}`;
                } else if (reportType === 'showtimes') {
                    line = `${row.start_time} | ${row.content.title} | ${row.tickets_sold}/${row.capacity} | Ingresos: ${row.revenue}`;
                } else if (reportType === 'rentals') {
                    line = `${row.event_name} | ${row.requested_start_time} | ${row.status.description} | Precio: ${row.price}`;
                }
                doc.fontSize(9).text(line);
                currentY += rowHeight;
            }
            if (rows.length > 20) {
                doc.text(`... y ${rows.length - 20} registros adicionales (exporte a Excel para verlos completos).`);
            }
        }

        doc.end();
        return new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
        });
    }
}
