import ReportsManagementService from '@services/reports-management.service.js';
import { ValidationError } from '@errors';

class ReportsModuleService {
    getSalesReport(cinemaId: number, filters: any) {
        return ReportsManagementService.getSalesReport(cinemaId, filters);
    }
    getMoviesReport(cinemaId: number, filters: any) {
        return ReportsManagementService.getMoviesReport(cinemaId, filters);
    }
    getInventoryReport(cinemaId: number, filters: any) {
        return ReportsManagementService.getInventoryReport(cinemaId, filters);
    }
    getShowtimesReport(cinemaId: number, filters: any) {
        return ReportsManagementService.getShowtimesReport(cinemaId, filters);
    }
    getRentalsReport(cinemaId: number, filters: any) {
        return ReportsManagementService.getRentalsReport(cinemaId, filters);
    }

    getCashierReport(employeeId: number, cinemaId: number, filters: any) {
        if (!employeeId) throw new ValidationError('No se pudo determinar el empleado desde la sesión');
        return ReportsManagementService.getCashierReport(employeeId, cinemaId, filters);
    }
}

export default new ReportsModuleService();
