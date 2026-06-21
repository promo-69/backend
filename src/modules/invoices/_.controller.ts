import { ControllerBase } from '@bases/controller.base.js';
import InvoicesService from '@modules/invoices/_.service.js';

class InvoicesController extends ControllerBase {
    constructor() {
        super();
    }

    private _session() { return this.getSession<any>(); }
    private _params() { return this.getParams(); }
    private _query() { return this.getQuery(); }
    private _body<T = any>() { return this.getBody<T>(); }

    /**
     * Resuelve cinemaId con prioridad:
     * 1. ?cinemaId (superadmin filtrando sede)
     * 2. cinemaId del JWT (empleado anclado a su sede)
     * 3. undefined (superadmin vista global)
     */
    private _resolveCinemaId(): number | undefined {
        const q = this._query();
        if (q.cinemaId) return Number(q.cinemaId);
        const sessionCinemaId = this._session()?.cinemaId;
        return sessionCinemaId ? Number(sessionCinemaId) : undefined;
    }

    // GET /invoices
    async findAll() {
        const q = this._query();
        const data = await InvoicesService.findAll({
            cinemaId: this._resolveCinemaId(),
            employeeId: q.employeeId ? Number(q.employeeId) : undefined,
            from: q.from as string | undefined,
            to: q.to as string | undefined,
            search: q.search as string | undefined,
            status: (q.status as 'all' | 'active' | 'voided' | undefined) ?? 'all',
            page: q.page ? Number(q.page) : 1,
            limit: q.limit ? Number(q.limit) : 20,
        });
        return this.success(data, 'Facturas obtenidas exitosamente');
    }

    // GET /invoices/:id
    async findById() {
        const { id } = this._params();
        const data = await InvoicesService.findById(Number(id), this._resolveCinemaId());
        return this.success(data, 'Factura obtenida exitosamente');
    }

    // GET /invoices/:id/pdf?disposition=inline|attachment
    async downloadPdf() {
        const { id } = this._params();
        const q = this._query();
        const disposition = q.disposition === 'attachment' ? 'attachment' : 'inline';

        const data = await InvoicesService.findById(Number(id), this._resolveCinemaId());
        const pdfBuffer = await InvoicesService.generatePdf(data);
        this.getResponse().setHeader('Content-Type', 'application/pdf');
        this.getResponse().setHeader(
            'Content-Disposition',
            `${disposition}; filename="invoice-${data.invoice_number}.pdf"`,
        );
        this.getResponse().send(pdfBuffer);
    }

    // DELETE /invoices/:id/void
    async void() {
        const { id } = this._params();
        const { reason } = this._body<{ reason: string }>();
        const session = this._session();
        const employeeId = Number(session?.employeeId ?? session?.userId);
        await InvoicesService.voidInvoice(Number(id), reason, employeeId, this._resolveCinemaId());
        return this.success(null, 'Factura anulada exitosamente');
    }
}

export default new InvoicesController();
