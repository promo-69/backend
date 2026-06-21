import { Router } from 'express';
import invoicesController from '@modules/invoices/_.controller.js';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';

const router = Router();

// Listado con filtros (fecha, empleado, sede, búsqueda, anuladas)
router.get('/', verifySession, verifyPermission('CRUD:READ:INVOICES'), invoicesController.findAll);

// Detalle completo de una factura
router.get('/:id', verifySession, verifyPermission('CRUD:READ:INVOICES'), invoicesController.findById);

// Descarga en PDF
router.get('/:id/pdf', verifySession, verifyPermission('CRUD:READ:INVOICES'), invoicesController.downloadPdf);

// Anulación (soft delete + motivo + reversa de puntos + cambio de estado de orden)
router.delete('/:id/void', verifySession, verifyPermission('CRUD:DELETE:INVOICES'), invoicesController.void);

export default router;
