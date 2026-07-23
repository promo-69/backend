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
	findPayableForPOS(q: string | undefined, cinemaId: number | undefined, filters?: any) {
		return RentalManagementService.findPayableForPOS(q, cinemaId, filters);
	}
	registerPOSPayment(
		id: number,
		payment: { payment_method?: number; reference?: string; amount?: number },
		employeeId: number | undefined,
		cinemaId: number | undefined,
	) {
		return RentalManagementService.registerPOSPayment(id, payment, employeeId, cinemaId);
	}
}

export default new RentalsService();
