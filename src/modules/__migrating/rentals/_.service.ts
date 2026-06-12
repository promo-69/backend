import RentalManagementService from '@services/rental-management.service.js';

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
    confirmPayment(id: number, customerId?: number, cinemaId?: number) {
        return RentalManagementService.confirmPayment(id, customerId, cinemaId);
    }
    findAllRequests(filters?: any) {
        return RentalManagementService.findAllRequests(filters);
    }
}

export default new RentalsService();
