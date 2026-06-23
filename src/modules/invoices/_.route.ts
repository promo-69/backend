import { Router } from 'express';
import invoicesController from '@modules/invoices/_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// Listado con filtros (fecha, empleado, sede, búsqueda)
// INVOICES-ALL amplía el scope al superadmin; INVOICES es suficiente para empleados de su sede
router.get('/', verifySession, verifyPermission('CRUD:READ:INVOICES'), invoicesController.findAll);

// Solo facturas anuladas/canceladas (shorthand útil para la vista de cancelaciones)
router.get('/voided', verifySession, verifyPermission('CRUD:READ:INVOICES'), invoicesController.findVoided);

// Detalle completo de una factura
router.get('/:id', verifySession, verifyPermission('CRUD:READ:INVOICES'), invoicesController.findById);

// Descarga en PDF
router.get('/:id/pdf', verifySession, verifyPermission('CRUD:READ:INVOICES'), invoicesController.downloadPdf);

// Anulación (soft delete + motivo + reversa de puntos + cambio de estado de orden)
router.delete('/:id/void', verifySession, verifyPermission('CRUD:DELETE:INVOICES-VOID'), invoicesController.void);

export default router;
