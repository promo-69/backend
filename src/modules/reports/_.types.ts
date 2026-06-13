// Tipos comunes para los reportes

export interface DateRangeFilter {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
}

export interface SalesReportFilter extends DateRangeFilter {
    channel?: 'taquilla' | 'web' | 'app' | 'all';
}

// Estructuras de respuesta (no se usan directamente en el módulo, pero son útiles para documentación)
export interface PeriodRange {
    from: string;
    to: string;
}

export interface SalesSummary {
    total_orders: number;
    total_tickets: number;
    total_revenue: number;
    total_tax: number;
    total_concessions_revenue: number;
    total_loyalty_points_generated: number;
    net_revenue: number;
}

export interface DailySale {
    date: string;
    orders: number;
    tickets: number;
    revenue: number;
    loyalty_points: number;
}

export interface PaymentMethodBreakdown {
    payment_method: { id: number; description: string };
    total_amount: number;
    transaction_count: number;
}

export interface ProductBreakdown {
    product_id: number;
    product_name: string;
    type: 'product' | 'combo';
    quantity_sold: number;
    total_revenue: number;
}
