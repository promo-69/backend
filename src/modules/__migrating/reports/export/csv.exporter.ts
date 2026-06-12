export class CSVExporter {
    static toCSV(reportType: string, data: any): string {
        const rows: any[] = (() => {
            if (reportType === 'sales') return data.daily_series ?? [];
            if (reportType === 'movies') return data.movies ?? [];
            if (reportType === 'events') return data.events ?? [];
            if (reportType === 'inventory') return data.products ?? [];
            if (reportType === 'cashier') return data.transactions ?? [];
            if (reportType === 'showtimes') return data.showtimes ?? [];
            if (reportType === 'rentals') return data.requests ?? [];
            return [];
        })();

        if (rows.length === 0) return 'no_data\n';

        const flatten = (obj: any, prefix = ''): Record<string, string> => {
            return Object.keys(obj).reduce((acc: any, key) => {
                const val = obj[key];
                const pKey = prefix ? `${prefix}.${key}` : key;
                if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                    Object.assign(acc, flatten(val, pKey));
                } else if (!Array.isArray(val)) {
                    acc[pKey] = String(val ?? '');
                }
                return acc;
            }, {});
        };

        const flatRows = rows.map((r: any) => flatten(r));
        const headers = [...new Set(flatRows.flatMap(Object.keys))];
        const csvHeader = headers.join(',');
        const csvRows = flatRows.map((r: any) => headers.map((h) => `"${(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
        return [csvHeader, ...csvRows].join('\n');
    }
}
