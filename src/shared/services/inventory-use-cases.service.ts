import InventoryService from '@modules/inventory/_.service.js';

export const InventoryUseCases = {
    getStockByCinema: InventoryService.getStockByCinema.bind(InventoryService),
    registerMovements: InventoryService.registerMovements.bind(InventoryService),
};
