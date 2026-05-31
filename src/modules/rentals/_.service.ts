import RentalManagementService from '@services/rental-management.service.js';

// Este servicio solo adapta los parámetros del contexto HTTP.

class RentalsService {
    findAllByCinema(cinemaId: number, filters?: any) {
        return RentalManagementService.findAllByCinema(cinemaId, filters);
    }

    findMyRequests(customerId: number, filters?: any) {
        return RentalManagementService.findMyRequests(customerId, filters);
    }

    findById(id: number, cinemaId?: number) {
        return RentalManagementService.findById(id, cinemaId);
    }

    createRequest(body: any, customerId?: number) {
        return RentalManagementService.createRequest(body, customerId);
    }

    updateStatus(id: number, payload: any, cinemaId: number) {
        return RentalManagementService.updateStatus(id, payload, cinemaId);
    }
}

export default new RentalsService();
