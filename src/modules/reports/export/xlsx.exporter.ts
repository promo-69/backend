import ExcelJS from 'exceljs';

export class XLSXExporter {
    static async toXLSX(reportType: string, data: any): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(reportType.toUpperCase());

        let columns: any[] = [];
        let rows: any[] = [];

        switch (reportType) {
            case 'sales':
                columns = [
                    { header: 'Fecha', key: 'date', width: 12 },
                    { header: 'Órdenes', key: 'orders', width: 10 },
                    { header: 'Boletos', key: 'tickets', width: 10 },
                    { header: 'Ingresos', key: 'revenue', width: 15 },
                    { header: 'Puntos Lealtad', key: 'loyalty_points', width: 15 },
                ];
                rows = data.daily_series ?? [];
                break;
            case 'movies':
                columns = [
                    { header: 'Película ID', key: 'movie.id', width: 10 },
                    { header: 'Título', key: 'movie.title', width: 40 },
                    { header: 'Funciones', key: 'total_showtimes', width: 12 },
                    { header: 'Boletos Vendidos', key: 'total_tickets_sold', width: 18 },
                    { header: 'Ingresos', key: 'total_revenue', width: 15 },
                    { header: 'Ocupación (%)', key: 'avg_occupancy_pct', width: 15 },
                ];
                rows = data.movies ?? [];
                break;
            case 'events':
                columns = [
                    { header: 'Evento ID', key: 'event.id', width: 10 },
                    { header: 'Título', key: 'event.title', width: 40 },
                    { header: 'Funciones', key: 'total_showtimes', width: 12 },
                    { header: 'Boletos Vendidos', key: 'total_tickets_sold', width: 18 },
                    { header: 'Ingresos', key: 'total_revenue', width: 15 },
                    { header: 'Ocupación (%)', key: 'avg_occupancy_pct', width: 15 },
                ];
                rows = data.events ?? [];
                break;
            case 'inventory':
                columns = [
                    { header: 'Producto', key: 'product.name', width: 30 },
                    { header: 'SKU', key: 'product.sku', width: 15 },
                    { header: 'Stock Actual', key: 'current_stock', width: 12 },
                    { header: 'Stock Mínimo', key: 'minimum_stock', width: 12 },
                    { header: 'Unidades Vendidas', key: 'units_sold', width: 18 },
                    { header: 'Unidades Recibidas', key: 'units_received', width: 18 },
                    { header: 'Valorización Stock', key: 'stock_value', width: 18 },
                    { header: 'Precio Venta', key: 'product.selling_price', width: 15 },
                ];
                rows = data.products ?? [];
                break;
            case 'cashier':
                columns = [
                    { header: 'Orden ID', key: 'order_id', width: 10 },
                    { header: 'Fecha', key: 'created_at', width: 20 },
                    { header: 'Estado', key: 'status.description', width: 15 },
                    { header: 'Total', key: 'total', width: 12 },
                ];
                rows = data.transactions ?? [];
                break;
            case 'showtimes':
                columns = [
                    { header: 'ID Función', key: 'showtime_id', width: 10 },
                    { header: 'Inicio', key: 'start_time', width: 20 },
                    { header: 'Contenido', key: 'content.title', width: 40 },
                    { header: 'Tipo', key: 'content.type', width: 10 },
                    { header: 'Sala', key: 'room.name', width: 15 },
                    { header: 'Capacidad', key: 'capacity', width: 10 },
                    { header: 'Boletos Vendidos', key: 'tickets_sold', width: 18 },
                    { header: 'Ocupación (%)', key: 'occupancy_pct', width: 15 },
                    { header: 'Ingresos', key: 'revenue', width: 15 },
                ];
                rows = data.showtimes ?? [];
                break;
            case 'rentals':
                columns = [
                    { header: 'ID Solicitud', key: 'id', width: 10 },
                    { header: 'Evento', key: 'event_name', width: 30 },
                    { header: 'Fecha Inicio', key: 'requested_start_time', width: 20 },
                    { header: 'Estado', key: 'status.description', width: 15 },
                    { header: 'Precio', key: 'price', width: 12 },
                ];
                rows = data.requests ?? [];
                break;
            default:
                throw new Error(`Tipo de reporte no soportado para Excel: ${reportType}`);
        }

        worksheet.columns = columns;

        for (const row of rows) {
            const flat = this._flattenForExcel(row);
            worksheet.addRow(flat);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    private static _flattenForExcel(obj: any, prefix = ''): any {
        const result: any = {};
        for (const [key, val] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                Object.assign(result, this._flattenForExcel(val, newKey));
            } else {
                result[newKey] = val ?? '';
            }
        }
        return result;
    }
}
