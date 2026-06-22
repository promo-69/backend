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

        // Ancho útil fijo — todos los bloques deben respetar este límite
        const PAGE_W = doc.page.width; // 595.28
        const ML = 40; // margen izquierdo
        const MR = 40; // margen derecho
        const INNER = PAGE_W - ML - MR; // 515.28 — ancho real del contenido

        // Bolívar Soberano (VES) es la moneda base del sistema (is_base_currency=true).
        // El monto de la orden SIEMPRE se guarda ya convertido a esa moneda — por
        // eso el fallback nunca debe ser '$': si la relación de moneda no cargó,
        // seguimos mostrando bolívares, no dólares.
        const sym = invoice.order?.currency?.symbol ?? 'Bs.';

        // ── CABECERA ──────────────────────────────────────────────────────────
        doc.rect(ML, 40, INNER, 60).fill(PRIMARY);

        doc.fontSize(20)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text('CINEFLIX', ML + 10, 52, { width: INNER / 2, lineBreak: false });

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#cccccc')
            .text(invoice.cinema?.name ?? '', ML + 10, 76, { width: INNER / 2, lineBreak: false });

        if (invoice.is_voided) {
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor(RED)
                .text('ANULADA', ML, 62, { width: INNER - 10, align: 'right', lineBreak: false });
        }

        let y = 115;

        // ── INFO GENERAL DE LA FACTURA ────────────────────────────────────────
        doc.rect(ML, y, INNER, 52).fill(LIGHT).stroke('#e5e7eb');

        const halfW = INNER / 2 - 10;
        doc.fontSize(13)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text(`Factura N° ${invoice.invoice_number}`, ML + 8, y + 7, { width: halfW, lineBreak: false });

        doc.fontSize(8.5)
            .font('Helvetica')
            .fillColor(GRAY)
            .text(`Emitida: ${new Date(invoice.issued_at).toLocaleString('es-VE')}`, ML + 8, y + 27, {
                width: halfW,
                lineBreak: false,
            });

        if (invoice.order?.created_at) {
            doc.fontSize(8)
                .fillColor(GRAY)
                .text(
                    `Orden #${invoice.order.id} — ${new Date(invoice.order.created_at).toLocaleString('es-VE')}`,
                    ML + 8,
                    y + 39,
                    { width: halfW, lineBreak: false },
                );
        }

        const totalX = ML + INNER / 2 + 5;
        const totalColW = halfW - 13; // margen de seguridad real para que el texto no toque el borde
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor(PRIMARY)
            .text(`Total: ${sym} ${Number(invoice.order?.total ?? 0).toFixed(2)}`, totalX, y + 7, {
                width: totalColW,
                align: 'right',
                lineBreak: false,
                ellipsis: true,
            });

        doc.fontSize(8.5)
            .font('Helvetica')
            .fillColor(GRAY)
            .text(`Subtotal: ${sym} ${Number(invoice.order?.subtotal ?? 0).toFixed(2)}`, totalX, y + 27, {
                width: totalColW,
                align: 'right',
                lineBreak: false,
                ellipsis: true,
            })
            .text(`Impuestos: ${sym} ${Number(invoice.order?.tax_amount ?? 0).toFixed(2)}`, totalX, y + 39, {
                width: totalColW,
                align: 'right',
                lineBreak: false,
                ellipsis: true,
            });

        y += 66;

        // ── SECCIÓN CAJERO (compacta, secundaria) ─────────────────────────────
        if (invoice.employee || invoice.cinema) {
            doc.rect(ML, y, INNER, 14).fill('#e8e4f3');
            doc.fontSize(7.5)
                .font('Helvetica-Bold')
                .fillColor(PRIMARY)
                .text('ATENDIDO POR', ML + 4, y + 3, { lineBreak: false });
            y += 14;

            const cashierParts: string[] = [];
            if (invoice.employee?.name) cashierParts.push(invoice.employee.name);
            if (invoice.cinema?.name) cashierParts.push(`— ${invoice.cinema.name}`);

            doc.fontSize(8.5)
                .font('Helvetica')
                .fillColor(PRIMARY)
                .text(cashierParts.join(' '), ML + 8, y + 4, { width: INNER - 16, lineBreak: false });

            y += 20;
        }

        y += 6;

        // ── CLIENTE (prominente, bloque completo) ─────────────────────────────
        this._drawSectionTitle(doc, 'DATOS DEL CLIENTE', ML, y, INNER);
        y += 18;

        if (invoice.customer) {
            const c = invoice.customer;

            // Nombre en grande
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor(PRIMARY)
                .text(c.name, ML + 8, y, { width: INNER - 16 });
            y += 16;

            const customerFields: [string, string][] = [['Documento', c.document ?? '—']];
            if (c.email) customerFields.push(['Email', c.email]);
            if (c.phone) customerFields.push(['Teléfono', c.phone]);

            // Datos de facturación del encabezado (billing_name puede diferir del cliente)
            if (invoice.billing_name && invoice.billing_name !== c.name) {
                customerFields.push(['Razón de facturación', invoice.billing_name]);
            }
            if (invoice.billing_document && invoice.billing_document !== c.document) {
                customerFields.push(['Doc. facturación', invoice.billing_document]);
            }
            if (invoice.billing_address) {
                customerFields.push(['Dirección', invoice.billing_address]);
            }

            const labelW = 110;
            const valueW = INNER - 16 - labelW - 6;

            for (const [label, value] of customerFields) {
                doc.fontSize(8.5)
                    .font('Helvetica-Bold')
                    .fillColor(GRAY)
                    .text(`${label}:`, ML + 8, y, { width: labelW, lineBreak: false });
                // Valor con ellipsis si es demasiado largo — pero width controla el wrap
                doc.fontSize(8.5)
                    .font('Helvetica')
                    .fillColor(PRIMARY)
                    .text(value, ML + 8 + labelW + 6, y, { width: valueW, lineBreak: false });
                y += 13;
            }
        } else {
            // Datos de facturación cuando no hay cliente registrado
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor(PRIMARY)
                .text(invoice.billing_name ?? 'Cliente anónimo', ML + 8, y, { width: INNER - 16 });
            y += 13;

            if (invoice.billing_document) {
                doc.fontSize(8.5)
                    .font('Helvetica')
                    .fillColor(GRAY)
                    .text(`Doc: ${invoice.billing_document}`, ML + 8, y, { width: INNER - 16, lineBreak: false });
                y += 13;
            }
            if (invoice.billing_address) {
                doc.fontSize(8.5)
                    .font('Helvetica')
                    .fillColor(GRAY)
                    .text(`Dir: ${invoice.billing_address}`, ML + 8, y, { width: INNER - 16 });
                y = doc.y + 2;
            }
        }

        y += 10;

        // ── LÍNEAS DE COMPRA ──────────────────────────────────────────────────
        y = this._drawLinesTable(doc, invoice.lines ?? [], ML, y, INNER, sym);
        y += 10;

        // ── MÉTODOS DE PAGO ───────────────────────────────────────────────────
        if ((invoice.payments ?? []).length > 0) {
            this._drawSectionTitle(doc, 'MÉTODOS DE PAGO', ML, y, INNER);
            y += 20;

            const amountColW = 130;
            const labelColW = INNER - 16 - amountColW - 6;
            const colLabel = ML + 8;
            const colAmount = colLabel + labelColW + 6;

            for (const p of invoice.payments) {
                const ref = p.reference_number ? ` (Ref: ${p.reference_number})` : '';
                const label = `${p.method?.description ?? 'Pago'}${ref}`;
                const baseSym = p.base_currency?.symbol ?? sym;
                const amount = `${baseSym} ${Number(p.amount_base_currency ?? 0).toFixed(2)}`;

                doc.fontSize(8.5)
                    .font('Helvetica')
                    .fillColor(PRIMARY)
                    .text(label, colLabel, y, { width: labelColW, lineBreak: false, ellipsis: true });
                doc.fontSize(8.5)
                    .font('Helvetica-Bold')
                    .fillColor(PRIMARY)
                    .text(amount, colAmount, y, { width: amountColW, align: 'right', lineBreak: false });
                y += 14;

                // Si pagó en otra moneda (ej. USD), se desglosa el monto original
                // debajo, en letra pequeña, sin invadir la columna de monto principal.
                if (p.paid_in_other_currency && p.original_amount != null) {
                    const origSym = p.original_currency?.symbol ?? '';
                    doc.fontSize(7.5)
                        .font('Helvetica')
                        .fillColor(GRAY)
                        .text(
                            `Pagado en ${p.original_currency?.code ?? 'divisa'}: ${origSym} ${Number(p.original_amount).toFixed(2)} (Tasa: ${Number(p.exchange_rate ?? 0).toFixed(2)})`,
                            colLabel,
                            y,
                            { width: INNER - 16, lineBreak: false },
                        );
                    y += 12;
                }
            }
            y += 6;
        }

        // ── IMPUESTOS (desglosados) ───────────────────────────────────────────
        if ((invoice.taxes ?? []).length > 0) {
            this._drawSectionTitle(doc, 'IMPUESTOS APLICADOS', ML, y, INNER);
            y += 20;

            const taxAmountColW = 110;
            const taxLabelColW = INNER - 16 - taxAmountColW - 6;
            const colTaxLabel = ML + 8;
            const colTaxAmount = colTaxLabel + taxLabelColW + 6;
            const baseSym = invoice.order?.currency?.symbol ?? sym;

            // Subtotal base (antes de impuestos)
            const subtotal = Number(invoice.order?.subtotal ?? 0);
            doc.fontSize(8)
                .font('Helvetica')
                .fillColor(GRAY)
                .text('Base imponible:', colTaxLabel, y, { width: taxLabelColW, lineBreak: false });
            doc.fontSize(8)
                .font('Helvetica')
                .fillColor(GRAY)
                .text(`${baseSym} ${subtotal.toFixed(2)}`, colTaxAmount, y, {
                    width: taxAmountColW,
                    align: 'right',
                    lineBreak: false,
                });
            y += 13;

            doc.moveTo(ML, y)
                .lineTo(ML + INNER, y)
                .stroke('#e5e7eb');
            y += 6;

            for (const t of invoice.taxes) {
                const taxName = t.tax?.name ?? 'Impuesto';
                const rate = `${Number(t.applied_rate).toFixed(1)}%`;
                const label = `${taxName} (${rate})`;
                const amount = `${baseSym} ${Number(t.amount).toFixed(2)}`;

                const startY = y;
                doc.fontSize(8.5)
                    .font('Helvetica')
                    .fillColor(PRIMARY)
                    .text(label, colTaxLabel, y, { width: taxLabelColW, ellipsis: true, lineBreak: false });
                doc.fontSize(8.5)
                    .font('Helvetica-Bold')
                    .fillColor(PRIMARY)
                    .text(amount, colTaxAmount, startY, { width: taxAmountColW, align: 'right', lineBreak: false });
                y += 14;
            }

            // Línea separadora + Total impuestos
            doc.moveTo(ML, y)
                .lineTo(ML + INNER, y)
                .stroke('#e5e7eb');
            y += 6;

            const totalTax = invoice.taxes.reduce((s: number, t: any) => s + Number(t.amount), 0);
            doc.fontSize(8.5)
                .font('Helvetica-Bold')
                .fillColor(PRIMARY)
                .text('Total impuestos:', colTaxLabel, y, { width: taxLabelColW, lineBreak: false });
            doc.fontSize(8.5)
                .font('Helvetica-Bold')
                .fillColor(PRIMARY)
                .text(`${baseSym} ${totalTax.toFixed(2)}`, colTaxAmount, y, {
                    width: taxAmountColW,
                    align: 'right',
                    lineBreak: false,
                });
            y += 18;

            // Total final destacado
            doc.rect(ML, y, INNER, 22).fill(PRIMARY);
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#ffffff')
                .text(`TOTAL A PAGAR: ${baseSym} ${Number(invoice.order?.total ?? 0).toFixed(2)}`, ML + 8, y + 6, {
                    width: INNER - 16,
                    align: 'right',
                    lineBreak: false,
                });
            y += 32;
        }

        // ── QR ────────────────────────────────────────────────────────────────
        if (invoice.order?.qr_code) {
            doc.rect(ML, y, INNER, 50).fill(LIGHT).stroke('#e5e7eb');
            doc.fontSize(8)
                .font('Helvetica')
                .fillColor(GRAY)
                .text('Código QR de validación:', ML + 8, y + 8, { lineBreak: false });
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor(ACCENT)
                .text(invoice.order.qr_code, ML + 8, y + 22, { width: INNER - 16 });
            y += 60;
        }

        // ── ANULACIÓN ─────────────────────────────────────────────────────────
        if (invoice.is_voided) {
            const voidH = invoice.voided_by ? 46 : 32;
            doc.rect(ML, y, INNER, voidH).fill('#FEF2F2').stroke('#FECACA');
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor(RED)
                .text('FACTURA ANULADA', ML + 8, y + 6, { width: INNER - 16, lineBreak: false });
            doc.fontSize(8.5)
                .font('Helvetica')
                .fillColor(RED)
                .text(`Motivo: ${invoice.voided_reason ?? '—'}`, ML + 8, y + 19, { width: INNER - 16 });
            if (invoice.voided_by) {
                doc.text(`Anulada por: ${invoice.voided_by.name}`, ML + 8, y + 32, {
                    width: INNER - 16,
                    lineBreak: false,
                });
            }
            y += voidH + 10;
        }

        // ── PIE ───────────────────────────────────────────────────────────────
        doc.fontSize(7.5)
            .font('Helvetica')
            .fillColor('#999999')
            .text(`Generado el ${new Date().toLocaleString('es-VE')} — Cineflix`, ML, y + 10, {
                width: INNER,
                align: 'center',
                lineBreak: false,
            });

        doc.end();
        return new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static _drawSectionTitle(doc: any, title: string, x: number, y: number, width: number) {
        doc.rect(x, y, width, 16).fill(PRIMARY);
        doc.fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text(title, x + 6, y + 4, { width: width - 12, lineBreak: false });
    }

    private static _drawLinesTable(doc: any, lines: any[], x: number, y: number, width: number, sym: string): number {
        if (!lines.length) return y;

        this._drawSectionTitle(doc, 'DETALLE DE LA COMPRA', x, y, width);
        y += 24;

        // Anchos de columna (suma = width)
        const itemW = width - 150;
        const qtyW = 40;
        const priceW = 60;
        const totW = 50;

        const colItem = x + 6;
        const colQty = x + itemW + 6;
        const colPrice = colQty + qtyW;
        const colTot = colPrice + priceW;

        // Cabecera
        doc.fontSize(7.5)
            .font('Helvetica-Bold')
            .fillColor(GRAY)
            .text('Ítem', colItem, y, { width: itemW, lineBreak: false })
            .text('Cant.', colQty, y, { width: qtyW, align: 'right', lineBreak: false })
            .text('P. Unit.', colPrice, y, { width: priceW, align: 'right', lineBreak: false })
            .text('Total', colTot, y, { width: totW, align: 'right', lineBreak: false });
        y += 12;

        doc.moveTo(x, y)
            .lineTo(x + width, y)
            .stroke('#e5e7eb');
        y += 4;

        for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            if (i % 2 === 0) doc.rect(x, y - 2, width, 16).fill(LIGHT);

            const name = l.item?.name ?? l.type?.description ?? 'Ítem';

            // Texto del ítem puede dar salto de línea — calculamos la altura real
            const startY = y;
            doc.fontSize(8).font('Helvetica').fillColor(PRIMARY).text(name, colItem, y, { width: itemW }); // puede ser multiline
            const endY = doc.y;
            const rowH = Math.max(endY - startY, 14);

            doc.fontSize(8)
                .font('Helvetica')
                .fillColor(PRIMARY)
                .text(String(l.quantity), colQty, startY, { width: qtyW, align: 'right', lineBreak: false })
                .text(`${sym} ${Number(l.unit_price).toFixed(2)}`, colPrice, startY, {
                    width: priceW,
                    align: 'right',
                    lineBreak: false,
                })
                .text(`${sym} ${Number(l.line_total).toFixed(2)}`, colTot, startY, {
                    width: totW,
                    align: 'right',
                    lineBreak: false,
                });

            y = startY + rowH + 2;
        }

        doc.moveTo(x, y)
            .lineTo(x + width, y)
            .stroke('#e5e7eb');
        return y;
    }
}
