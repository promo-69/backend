import { ControllerBase } from '@bases/controller.base.js';
import CinemasService from './_.service.js';
import EmployeeManagementService from '@services/employee-management.service.js';
import { ValidationError } from '@errors/validation.error.js';

class CinemasController extends ControllerBase {
    constructor() {
        super();
    }

    // GET /cinemas — público
    async findAll() {
        const data = await CinemasService.findAll(this.getQueryFilters());
        return data;
    }

    // GET /cinemas/:id — público
    async findById() {
        const { id } = this.getParams();
        const data = await CinemasService.findById(Number(id));
        return this.success(data, 'Sucursal obtenida exitosamente');
    }


    // GET /cinemas/rooms-available — gerencia general
    async findAllWithRooms() {
		console.log('by rooms')
        const data = await CinemasService.findAllWithRooms(this.getQueryFilters());
        return data;
    }

    // POST /cinemas — gerencia general
    async create() {
        const body = this.getBody();
        const session = this.getSession<any>();
        const data = await CinemasService.createCinema(body, session?.userId);
        return this.created(data, 'Sucursal registrada exitosamente');
    }

    // PATCH /cinemas/:id — gerencia general (sin restricciones)
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        await CinemasService.updateCinema(Number(id), body, session.userId, false);
        return this.success(null, 'Sucursal actualizada exitosamente');
    }

    // PATCH /cinemas — gerente de sede (contexto implícito, restringido)
    async updateOwnCinema() {
        const session = this.getSession<any>();
        if (!session.cinemaId) throw new ValidationError('No tienes una sucursal asignada en tu sesión', []);
        const body = this.getBody();
        await CinemasService.updateCinema(session.cinemaId, body, session.userId, true);
        return this.success(null, 'Sucursal actualizada exitosamente');
    }

    // DELETE /cinemas/:id — soft delete
    async delete() {
        const { id } = this.getParams();
        await CinemasService.deleteCinema(Number(id));
        return this.success(null, 'Sucursal eliminada exitosamente');
    }

    // GET /cinemas/:cinemaId/employees — usa caso de uso compartido
    async findEmployeesByCinema() {
        const { cinemaId } = this.getParams();
        const data = await EmployeeManagementService.findAllEmployees(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    // POST /cinemas/:cinemaId/employees — usa caso de uso compartido
    async createEmployeeInCinema() {
        const { cinemaId } = this.getParams();
        const employeeData = this.getBody();
        const data = await EmployeeManagementService.createEmployee(employeeData, Number(cinemaId));
        return this.created(data, 'Empleado creado exitosamente');
    }

    // DELETE /cinemas/:cinemaId/employees/:employeeId
    async removeEmployeeFromCinema() {
        const { cinemaId, employeeId } = this.getParams();
        await EmployeeManagementService.deleteEmployee(Number(employeeId), Number(cinemaId));
        return this.success(null, 'Empleado desactivado exitosamente');
    }
}

export default new CinemasController();
