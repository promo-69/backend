export interface Column {
    header: string;
    key: string; // soporta notación anidada: 'movie.title'
    width?: number; // solo para PDF
    align?: 'left' | 'right' | 'center';
}

export function getReportColumns(reportType: string): Column[] {
    switch (reportType) {
        case 'sales':
            return [
                { header: 'Fecha', key: 'date', width: 80, align: 'left' },
                { header: 'Órdenes', key: 'orders', width: 60, align: 'right' },
                { header: 'Boletos', key: 'tickets', width: 60, align: 'right' },
                { header: 'Ingresos', key: 'revenue', width: 70, align: 'right' },
                { header: 'Puntos', key: 'loyalty_points', width: 60, align: 'right' },
            ];
        case 'movies':
            return [
                { header: 'Película', key: 'movie.title', width: 140, align: 'left' },
                { header: 'Funciones', key: 'total_showtimes', width: 60, align: 'right' },
                { header: 'Boletos', key: 'total_tickets_sold', width: 60, align: 'right' },
                { header: 'Ingresos', key: 'total_revenue', width: 70, align: 'right' },
                { header: 'Ocupación %', key: 'avg_occupancy_pct', width: 60, align: 'right' },
            ];
        case 'events':
            return [
                { header: 'Evento', key: 'event.title', width: 140, align: 'left' },
                { header: 'Funciones', key: 'total_showtimes', width: 60, align: 'right' },
                { header: 'Boletos', key: 'total_tickets_sold', width: 60, align: 'right' },
                { header: 'Ingresos', key: 'total_revenue', width: 70, align: 'right' },
                { header: 'Ocupación %', key: 'avg_occupancy_pct', width: 60, align: 'right' },
            ];
        case 'inventory':
            return [
                { header: 'Producto', key: 'product.name', width: 120, align: 'left' },
                { header: 'Stock', key: 'current_stock', width: 50, align: 'right' },
                { header: 'Mínimo', key: 'minimum_stock', width: 50, align: 'right' },
                { header: 'Vendidos', key: 'units_sold', width: 60, align: 'right' },
                { header: 'Valor', key: 'stock_value', width: 70, align: 'right' },
            ];
        case 'cashier':
            return [
                { header: 'Orden ID', key: 'order_id', width: 60, align: 'right' },
                { header: 'Fecha', key: 'created_at', width: 100, align: 'left' },
                { header: 'Estado', key: 'status.description', width: 80, align: 'left' },
                { header: 'Total', key: 'total', width: 70, align: 'right' },
            ];
        case 'showtimes':
            return [
                { header: 'Inicio', key: 'start_time', width: 100, align: 'left' },
                { header: 'Contenido', key: 'content.title', width: 140, align: 'left' },
                { header: 'Sala', key: 'room.name', width: 60, align: 'left' },
                { header: 'Ocupación %', key: 'occupancy_pct', width: 60, align: 'right' },
                { header: 'Ingresos', key: 'revenue', width: 70, align: 'right' },
            ];
        case 'rentals':
            return [
                { header: 'Evento', key: 'event_name', width: 120, align: 'left' },
                { header: 'Inicio', key: 'requested_start_time', width: 100, align: 'left' },
                { header: 'Estado', key: 'status.description', width: 80, align: 'left' },
                { header: 'Precio', key: 'price', width: 70, align: 'right' },
            ];
        default:
            return [{ header: 'Datos', key: 'id', width: 200, align: 'left' }];
    }
}

export function getRowsByReportType(reportType: string, data: any): any[] {
    const map: Record<string, any[]> = {
        sales: data.daily_series ?? [],
        movies: data.movies ?? [],
        events: data.events ?? [],
        inventory: data.products ?? [],
        cashier: data.transactions ?? [],
        showtimes: data.showtimes ?? [],
        rentals: data.requests ?? [],
    };
    return map[reportType] || [];
}

export function getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current === null || current === undefined) return undefined;
        current = current[key];
    }
    return current;
}

export function getReportTitle(reportType: string): string {
    const map: Record<string, string> = {
        sales: 'Ventas',
        movies: 'Películas',
        events: 'Eventos Especiales',
        inventory: 'Inventario',
        cashier: 'Caja',
        showtimes: 'Funciones',
        rentals: 'Alquileres',
    };
    return map[reportType] || reportType.toUpperCase();
}
