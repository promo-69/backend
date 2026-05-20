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

    // PUT /cinemas — contexto implícito (gerente de sede)
    async updateOwnCinema() {
        const session = this.getSession<any>();
        if (!session.cinemaId) throw new ValidationError('No tienes una sucursal asignada', []);
        const body = this.getBody();
        await CinemasService.updateCinema(session.cinemaId, body, session.userId, true); // restringido
        return this.success(null, 'Sucursal actualizada exitosamente');
    }

    // PUT /cinemas/:id — contexto explícito (gerencia general)
    async update() {
        const { id } = this.getParams();
        const body = this.getBody();
        const session = this.getSession<any>();
        await CinemasService.updateCinema(Number(id), body, session.userId, false); // sin restricciones
        return this.success(null, 'Sucursal actualizada exitosamente');
    }

    // PATCH /cinemas/:id/status — desactivar/activar sede
    async setStatus() {
        const { id } = this.getParams();
        const { active } = this.getBody();
        await CinemasService.setCinemaStatus(Number(id), active);
        return this.success(null, `Sucursal ${active ? 'activada' : 'desactivada'} exitosamente`);
    }

    // --- Empleados en una sucursal ---
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
