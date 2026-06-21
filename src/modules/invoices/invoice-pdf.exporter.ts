import PDFDocument from 'pdfkit';

const PRIMARY = '#231640';
const ACCENT = '#d9982f';
const LIGHT = '#f9f9f9';
const GRAY = '#666666';
const RED = '#DC2626';

export class InvoicePDFExporter {
    static async toPDF(invoice: any): Promise<Buffer> {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));

        const pageW = doc.page.width - 80;

        // ── Cabecera ──────────────────────────────────────────────────────────
        doc.rect(40, 40, pageW, 60).fill(PRIMARY);

        doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff')
            .text('CINEFLIX', 50, 52, { width: pageW / 2 });

        doc.fontSize(9).font('Helvetica').fillColor('#cccccc')
            .text(invoice.cinema?.name ?? '', 50, 76, { width: pageW / 2 });

        if (invoice.is_voided) {
            doc.fontSize(14).font('Helvetica-Bold').fillColor(RED)
                .text('ANULADA', 50, 56, { width: pageW, align: 'right' });
        }

        doc.fillColor(PRIMARY);
        doc.moveDown(0.5);
        let y = 115;

        // ── Info de factura ───────────────────────────────────────────────────
        doc.rect(40, y, pageW, 50).fill(LIGHT).stroke('#e5e7eb');

        doc.fontSize(14).font('Helvetica-Bold').fillColor(PRIMARY)
            .text(`Factura N° ${invoice.invoice_number}`, 50, y + 8, { width: pageW / 2 });

        doc.fontSize(9).font('Helvetica').fillColor(GRAY)
            .text(`Emitida: ${new Date(invoice.issued_at).toLocaleString('es-VE')}`, 50, y + 28, { width: pageW / 2 });

        if (invoice.order?.created_at) {
            doc.text(`Orden #${invoice.order.id} — ${new Date(invoice.order.created_at).toLocaleString('es-VE')}`, 50, y + 38, { width: pageW / 2 });
        }

        const totalX = 40 + pageW / 2 + 10;
        doc.fontSize(11).font('Helvetica-Bold').fillColor(PRIMARY)
            .text(`Total: ${invoice.order?.currency?.symbol ?? '$'} ${Number(invoice.order?.total ?? 0).toFixed(2)}`, totalX, y + 8, { width: pageW / 2, align: 'right' });

        doc.fontSize(9).font('Helvetica').fillColor(GRAY)
            .text(`Subtotal: ${Number(invoice.order?.subtotal ?? 0).toFixed(2)}`, totalX, y + 24, { width: pageW / 2, align: 'right' })
            .text(`Impuestos: ${Number(invoice.order?.tax_amount ?? 0).toFixed(2)}`, totalX, y + 35, { width: pageW / 2, align: 'right' });

        y += 65;

        // ── Datos de facturación y cliente en dos columnas ────────────────────
        this._drawSectionTitle(doc, 'DATOS DE FACTURACIÓN', 40, y, pageW / 2 - 5);
        this._drawSectionTitle(doc, 'CLIENTE', 40 + pageW / 2 + 5, y, pageW / 2 - 5);
        y += 18;

        const billingLines = [
            invoice.billing_name,
            `Doc: ${invoice.billing_document}`,
            ...(invoice.billing_address ? [invoice.billing_address] : []),
        ];
        const customerLines = invoice.customer
            ? [
                  `${invoice.customer.name}`,
                  `Doc: ${invoice.customer.document ?? '—'}`,
                  ...(invoice.customer.email ? [`Email: ${invoice.customer.email}`] : []),
                  ...(invoice.customer.phone ? [`Tel: ${invoice.customer.phone}`] : []),
              ]
            : ['Cliente anónimo'];

        const leftH = this._drawInfoBlock(doc, billingLines, 50, y, pageW / 2 - 20);
        const rightH = this._drawInfoBlock(doc, customerLines, 40 + pageW / 2 + 15, y, pageW / 2 - 20);
        y += Math.max(leftH, rightH) + 16;

        if (invoice.employee) {
            doc.fontSize(8).font('Helvetica').fillColor(GRAY)
                .text(`Atendido por: ${invoice.employee.name}`, 50, y);
            y += 14;
        }
        y += 4;

        // ── Líneas de la orden ────────────────────────────────────────────────
        y = this._drawLinesTable(doc, invoice.lines ?? [], 40, y, pageW, invoice.order?.currency?.symbol ?? '$');
        y += 10;

        // ── Pagos ─────────────────────────────────────────────────────────────
        if ((invoice.payments ?? []).length > 0) {
            this._drawSectionTitle(doc, 'MÉTODOS DE PAGO', 40, y, pageW);
            y += 18;
            for (const p of invoice.payments) {
                doc.fontSize(9).font('Helvetica').fillColor(PRIMARY)
                    .text(`${p.method?.description ?? 'Pago'}: ${invoice.order?.currency?.symbol ?? '$'} ${Number(p.amount).toFixed(2)}${p.reference_number ? ` (Ref: ${p.reference_number})` : ''}`, 50, y);
                y += 13;
            }
            y += 6;
        }

        // ── Impuestos ─────────────────────────────────────────────────────────
        if ((invoice.taxes ?? []).length > 0) {
            this._drawSectionTitle(doc, 'IMPUESTOS APLICADOS', 40, y, pageW);
            y += 18;
            for (const t of invoice.taxes) {
                doc.fontSize(9).font('Helvetica').fillColor(PRIMARY)
                    .text(`${t.tax?.name ?? 'Impuesto'} (${Number(t.applied_rate).toFixed(1)}%): ${invoice.order?.currency?.symbol ?? '$'} ${Number(t.amount).toFixed(2)}`, 50, y);
                y += 13;
            }
            y += 6;
        }

        // ── QR ───────────────────────────────────────────────────────────────
        if (invoice.order?.qr_code) {
            doc.rect(40, y, pageW, 50).fill(LIGHT).stroke('#e5e7eb');
            doc.fontSize(8).font('Helvetica').fillColor(GRAY)
                .text('Código QR de validación:', 50, y + 8);
            doc.fontSize(10).font('Helvetica-Bold').fillColor(ACCENT)
                .text(invoice.order.qr_code, 50, y + 22, { width: pageW - 20 });
            y += 60;
        }

        // ── Anulación ─────────────────────────────────────────────────────────
        if (invoice.is_voided) {
            doc.rect(40, y, pageW, invoice.voided_by ? 44 : 30).fill('#FEF2F2').stroke('#FECACA');
            doc.fontSize(9).font('Helvetica-Bold').fillColor(RED)
                .text('FACTURA ANULADA', 50, y + 6);
            doc.fontSize(8).font('Helvetica').fillColor(RED)
                .text(`Motivo: ${invoice.voided_reason ?? '—'}`, 50, y + 18);
            if (invoice.voided_by) {
                doc.text(`Anulada por: ${invoice.voided_by.name}`, 50, y + 30);
            }
            y += invoice.voided_by ? 54 : 40;
        }

        // ── Pie de página ─────────────────────────────────────────────────────
        doc.fontSize(8).font('Helvetica').fillColor('#999999')
            .text(`Generado el ${new Date().toLocaleString('es-VE')} — Cineflix`, 40, y + 10, { width: pageW, align: 'center' });

        doc.end();
        return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
    }

    private static _drawSectionTitle(doc: any, title: string, x: number, y: number, width: number) {
        doc.rect(x, y, width, 16).fill(PRIMARY);
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
            .text(title, x + 4, y + 4, { width: width - 8 });
    }

    private static _drawInfoBlock(doc: any, lines: string[], x: number, y: number, width: number): number {
        let h = 0;
        for (const line of lines) {
            doc.fontSize(8.5).font('Helvetica').fillColor(PRIMARY)
                .text(line, x, y + h, { width });
            h += 13;
        }
        return h;
    }

    private static _drawLinesTable(doc: any, lines: any[], x: number, y: number, width: number, currencySymbol: string): number {
        if (!lines.length) return y;

        this._drawSectionTitle(doc, 'DETALLE DE LA COMPRA', x, y, width);
        y += 18;

        const cols = { item: x + 4, qty: x + width - 140, price: x + width - 90, total: x + width - 45 };
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GRAY)
            .text('Ítem', cols.item, y)
            .text('Cant.', cols.qty, y, { width: 45, align: 'right' })
            .text('P. Unit.', cols.price, y, { width: 60, align: 'right' })
            .text('Total', cols.total, y, { width: 45, align: 'right' });
        y += 12;

        doc.moveTo(x, y).lineTo(x + width, y).stroke('#e5e7eb');
        y += 4;

        for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            if (i % 2 === 0) doc.rect(x, y - 2, width, 14).fill(LIGHT);
            const name = l.item?.name ?? l.type?.description ?? 'Ítem';
            doc.fontSize(8).font('Helvetica').fillColor(PRIMARY)
                .text(name, cols.item, y, { width: width - 160 })
                .text(String(l.quantity), cols.qty, y, { width: 45, align: 'right' })
                .text(`${currencySymbol} ${Number(l.unit_price).toFixed(2)}`, cols.price, y, { width: 60, align: 'right' })
                .text(`${currencySymbol} ${Number(l.line_total).toFixed(2)}`, cols.total, y, { width: 45, align: 'right' });
            y += 14;
        }

        doc.moveTo(x, y).lineTo(x + width, y).stroke('#e5e7eb');
        return y;
    }
}
