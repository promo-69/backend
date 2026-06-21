import InvoiceManagementService from '@services/invoice-management.service.js';
import { InvoicePDFExporter } from '@modules/invoices/invoice-pdf.exporter.js';

class InvoicesModuleService {
    findAll(filters: Parameters<typeof InvoiceManagementService.findAll>[0]) {
        return InvoiceManagementService.findAll(filters);
    }

    findById(id: number, cinemaId?: number) {
        return InvoiceManagementService.findById(id, cinemaId);
    }

    voidInvoice(id: number, reason: string, employeeId: number, cinemaId?: number) {
        return InvoiceManagementService.voidInvoice(id, reason, employeeId, cinemaId);
    }

    generatePdf(invoiceDetail: any): Promise<Buffer> {
        return InvoicePDFExporter.toPDF(invoiceDetail);
    }
}

export default new InvoicesModuleService();
