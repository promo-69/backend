import RentalManagementService from '@services/rental-management.service.js';

/**
 * Tarea encargada de procesar la expiración de una cotización (proforma) de alquiler.
 */
export async function rentalExpirationTask(rentalRequestId: number, bookingId: number | null): Promise<void> {
    await RentalManagementService.expireProforma(rentalRequestId, bookingId);
}
