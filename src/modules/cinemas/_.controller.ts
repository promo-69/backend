import { ControllerBase } from '@bases/controller.base.js';
import CinemasService from './_.service.js';
import EmployeesService from '../employees/_.service.js';
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

    // POST /cinemas — gerencia general
    async create() {
        const body = this.getBody();
        const session = this.getSession<any>();
        const data = await CinemasService.createCinema(body, session?.userId);
        return this.created(data, 'Sucursal registrada exitosamente');
    }

    // PUT /cinemas/:id — gerencia general (sin restricciones)
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        await CinemasService.updateCinema(Number(id), body, session.userId, false);
        return this.success(null, 'Sucursal actualizada exitosamente');
    }

    // PUT /cinemas — gerente de sede (contexto implícito, restringido)
    async updateOwnCinema() {
        const session = this.getSession<any>();
        if (!session.cinemaId) throw new ValidationError('No tienes una sucursal asignada', []);
        const body = this.getBody();
        await CinemasService.updateCinema(session.cinemaId, body, session.userId, true);
        return this.success(null, 'Sucursal actualizada exitosamente');
    }

    // DELETE /cinemas/:id — eliminar sucursal (soft delete via deleted_at)
    // La tabla cinemas NO tiene columna 'status'. Se elimina lógicamente.
    async delete() {
        const { id } = this.getParams();
        await CinemasService.deleteCinema(Number(id));
        return this.success(null, 'Sucursal eliminada exitosamente');
    }

    // GET /cinemas/:cinemaId/employees
    async findEmployeesByCinema() {
        const { cinemaId } = this.getParams();
        const data = await EmployeesService.findAllEmployees(Number(cinemaId), this.getQueryFilters());
        return data;
    }

    // POST /cinemas/:cinemaId/employees
    async createEmployeeInCinema() {
        const { cinemaId } = this.getParams();
        const employeeData = this.getBody();
        const session = { cinemaId: Number(cinemaId) };
        const data = await EmployeesService.createEmployee(employeeData, session);
        return this.created(data, 'Empleado creado exitosamente');
    }
}

export default new CinemasController();
