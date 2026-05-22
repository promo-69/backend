import EmployeesService from '@modules/employees/_.service.js';

export const EmployeeUseCases = {
    findAll: EmployeesService.findAllEmployees.bind(EmployeesService),
    createEmployee: EmployeesService.createEmployee.bind(EmployeesService),
    findById: EmployeesService.findEmployeeById.bind(EmployeesService), // ← nueva
    deleteEmployeeFromCinema: EmployeesService.deleteEmployee.bind(EmployeesService),
};
