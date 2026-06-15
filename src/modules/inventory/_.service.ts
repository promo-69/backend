import { BaseService } from '@bases/service.base.js';
import InventoryManagementService from '@services/inventory-management.service.js';
import { ValidationError } from '@errors';

interface RegisterMovementInput {
    operationType: number;
    quantity: number;
    remarks?: string;
    unit_cost?: number;
    adjustmentDirection?: 'increase' | 'decrease';
}

export class InventoryService extends BaseService {
    // -------------------------------------------------------------------------
    //  LECTURA
    // -------------------------------------------------------------------------

    async getStockByCinema(cinemaId: number, filters?: any) {
        return InventoryManagementService.getStockByCinema(cinemaId, filters);
    }

    /**
     * Stock de un producto individual en una sucursal — vista "ficha de
     * producto" (nombre, sku, categoría, moneda, precio, puntos de
     * lealtad, imagen, stock actual).
     */
    async getProductStock(cinemaId: number, productId: number) {
        if (!cinemaId) throw new ValidationError('Se requiere cinemaId', ['cinemaId']);
        if (!productId) throw new ValidationError('Se requiere productId', ['productId']);
        return InventoryManagementService.getProductStockByCinema(cinemaId, productId);
    }

    async getInventoryDetail(inventoryId: number) {
        return InventoryManagementService.getInventoryWithMovements(inventoryId);
    }

    // -------------------------------------------------------------------------
    //  ESCRITURA
    // -------------------------------------------------------------------------

    /**
     * Habilita un producto del catálogo central en el inventario de una
     * sucursal (stock inicial en 0). El ingreso de stock real se hace
     * después con registerMovements.
     */
    async provisionProduct(cinemaId: number, productId: number, minimumStock?: number) {
        if (!cinemaId) throw new ValidationError('Se requiere cinemaId', ['cinemaId']);
        if (!productId) throw new ValidationError('Se requiere productId', ['productId']);

        return InventoryManagementService.provisionProductInCinema(cinemaId, productId, minimumStock ?? 0);
    }

    /**
     * Registra un lote de movimientos (entrada/salida/ajuste) sobre un
     * registro de inventario.
     */
    async registerMovements(inventoryId: number, movements: RegisterMovementInput[], userId: number) {
        return InventoryManagementService.registerMovements(inventoryId, movements, userId);
    }

    // -------------------------------------------------------------------------
    //  ADMINISTRATIVO — BACKOFFICE GLOBAL
    // -------------------------------------------------------------------------

    /**
     * Listado de inventario de TODAS las sucursales (super admin / usuario
     * con permisos de backoffice). Permite filtrar por cinemaId opcional
     * vía query filters.
     */
    async getAllInventoryAdmin(filters?: any) {
        return InventoryManagementService.getAllInventoryAdmin(filters);
    }
}

export default new InventoryService();
