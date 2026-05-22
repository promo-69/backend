import { Router } from 'express';
import { verifySession, verifyPermission } from '@middlewares/auth.middleware.js';
import { ControllerBase } from '@bases/controller.base.js';
import InventoryService from '../inventory/_.service.js';
import { ValidationError } from '@errors';

class CinemaInventoryController extends ControllerBase {
    // GET /cinemas/:cinemaId/inventory — auditoría remota (contexto explícito)
    async findAll() {
        const { cinemaId } = this.getParams();
        const data = await InventoryService.getStockByCinema(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    // POST /cinemas/:cinemaId/inventory/:id/movements — reabastecimiento desde almacén central
    async addMovements() {
        const { id } = this.getParams();
        const body = this.getBody();

        if (!Array.isArray(body)) {
            throw new ValidationError('El cuerpo de la solicitud debe ser un arreglo de movimientos');
        }

        const session = this.getSession<any>();
        await InventoryService.registerMovements(Number(id), body, session.userId);
        return this.created(null, 'Movimientos registrados exitosamente');
    }
}

const cinemaInventoryController = new CinemaInventoryController();

const router = Router({ mergeParams: true });

router.get('/', verifySession, verifyPermission('CRUD:READ:INVENTORY'), cinemaInventoryController.findAll);
router.post(
    '/:id/movements',
    verifySession,
    verifyPermission('CRUD:CREATE:INVENTORY_MOVEMENT'),
    cinemaInventoryController.addMovements,
);

export default router;
