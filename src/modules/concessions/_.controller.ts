import { ControllerBase } from '@bases/controller.base.js';
import ConcessionsService from './_.service.js';
import ComboManagementService from '@services/combo-management.service.js';
import { ValidationError } from '@errors';

class ConcessionsController extends ControllerBase {
	constructor() {
		super();
	}

	// ----- Products -----
	async findAllProducts() {
		const session = this.getSession<any>();
		const data = await ConcessionsService.findAllProducts(this.getQueryFilters(), session?.userId);
		return data;
	}

	async findAllAvailableProducts() {
		const session = this.getSession<any>();
		const { cinemaId } = this.getQuery();
		const data = await ConcessionsService.findAllAvailableProducts(this.getQueryFilters(), {
			cinemaId,
			userId: session?.userId,
		});
		return data;
	}

	async findProductById() {
		const { id } = this.getParams();
		const session = this.getSession<any>();
		const data = await ConcessionsService.findProductById(Number(id), session?.userId);
		return this.success(data, 'Producto obtenido exitosamente');
	}

	async createProduct() {
		const body = this.getBody();
		const req = this.getRequest();
		const data = await ConcessionsService.createProduct(body, req.files as any);
		return this.created(data, 'Producto registrado exitosamente');
	}

	async updateProduct() {
		const { id } = this.getParams();
		const body = this.getBody();
		const req = this.getRequest();
		await ConcessionsService.updateProduct(Number(id), body, req.files as any);
		return this.success(null, 'Producto actualizado exitosamente');
	}

	async deleteProduct() {
		const { id } = this.getParams();
		await ConcessionsService.deleteProduct(Number(id));
		return this.success(null, 'Producto eliminado exitosamente');
	}

	// ----- Combos -----
	async findAllCombos() {
		const session = this.getSession<any>();
		const data = await ComboManagementService.findAllCombos(this.getQueryFilters(), session?.userId);
		return data;
	}

	async findAllAvailableCombos() {
		const session = this.getSession<any>();
		const { cinemaId } = this.getQuery();
		if (!cinemaId) throw new ValidationError('La sucursal es requerida');
		const data = await ComboManagementService.findAllCombos(
			{
				...this.getQueryFilters(),
				cinemaId: Number(cinemaId),
			},
			session?.userId,
		);
		return data;
	}

	async findComboById() {
		const { id } = this.getParams();
		const session = this.getSession<any>();
		const data = await ConcessionsService.findComboById(Number(id), session?.userId);
		return this.success(data, 'Combo obtenido exitosamente');
	}

	async createCombo() {
		const session = this.getSession<any>();
		const body = this.getBody();
		const req = this.getRequest();

		const cinemaId = session?.cinemaId;
		if (cinemaId === undefined) throw new ValidationError('Inicia sesión con una sucursal asignada.');

		const data = await ComboManagementService.createCombo(body, req.files as any, Number(cinemaId));
		return this.created(data, 'Combo registrado exitosamente');
	}

	async updateCombo() {
		const { id } = this.getParams();
		const body = this.getBody();
		const req = this.getRequest();
		const session = this.getSession<any>();
		await ConcessionsService.updateCombo(Number(id), body, req.files as any, session?.cinemaId);
		return this.success(null, 'Combo actualizado exitosamente');
	}

	async deleteCombo() {
		const { id } = this.getParams();
		const session = this.getSession<any>();
		await ConcessionsService.deleteCombo(Number(id), session?.cinemaId);
		return this.success(null, 'Combo eliminado exitosamente');
	}

	// ----- Combo Items (BOM) -----
	async addComboItems() {
		const { id } = this.getParams();
		const { items } = this.getBody();
		const session = this.getSession<any>();
		await ConcessionsService.addItemsToCombo(Number(id), items, session?.cinemaId);
		return this.created(null, 'Ítems agregados al combo exitosamente');
	}

	async removeComboItem() {
		const { id, itemId } = this.getParams();
		const session = this.getSession<any>();
		await ConcessionsService.removeItemFromCombo(Number(id), Number(itemId), session?.cinemaId);
		return this.success(null, 'Ítem eliminado del combo exitosamente');
	}
}

export default new ConcessionsController();
