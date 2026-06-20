// Tipos comunes para los reportes

export interface DateRangeFilter {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
}

export interface SalesReportFilter extends DateRangeFilter {
    channel?: 'taquilla' | 'web' | 'app' | 'all';
}

export interface ChartFilter extends DateRangeFilter {
    channel?: string;
    groupBy?: 'day' | 'week' | 'month';
}

// ── Respuestas de reportes individuales ──────────────────────────────────────

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

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
    total_revenue: number;
    total_orders: number;
    total_tickets: number;
    net_revenue: number;
    total_concessions_revenue: number;
    total_loyalty_points: number;
    avg_occupancy_pct: number;
    active_rentals: number;
    low_stock_alerts: number;
}

export interface DashboardTopMovie {
    id: number;
    title: string;
    total_tickets_sold: number;
    total_revenue: number;
    avg_occupancy_pct: number;
}

export interface DashboardLowStockProduct {
    id: number;
    name: string;
    current_stock: number;
    minimum_stock: number;
}

export interface DashboardReport {
    period: PeriodRange;
    kpis: DashboardKPIs;
    daily_series: DailySale[];
    payment_breakdown: PaymentMethodBreakdown[];
    top_movies: DashboardTopMovie[];
    top_events: { id: number; title: string; total_tickets_sold: number; total_revenue: number }[];
    low_stock_products: DashboardLowStockProduct[];
}

// ── Charts ───────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface ChartDataset {
    label: string;
    key: string;
    data: ChartDataPoint[];
}

export type ChartType = 'line' | 'bar' | 'pie' | 'area';

export interface ChartResponse {
    type: ChartType;
    period: PeriodRange;
    groupBy?: 'day' | 'week' | 'month';
    datasets: ChartDataset[];
    [key: string]: any; // datos adicionales específicos del reporte (payment_breakdown, low_stock, etc.)
}
