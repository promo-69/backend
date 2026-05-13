import { ControllerBase } from '@bases/controller.base.js';
import CatalogsService from './_.service.js';

class CatalogsController extends ControllerBase {
	constructor() {
		super();
	}

	async listAllCatalogs() {
		const filters = this.getQueryFilters();
		return CatalogsService.getAvailableCatalogs(filters);
	}

	async getMetadata() {
		const { catalogName } = this.getParams();
		return CatalogsService.getCatalogMetadata(catalogName);
	}

	async list() {
		const { catalogName } = this.getParams();
		const filters = this.getQueryFilters();
		const query = this.getQuery();
		const include = query.include === 'true';
		const includeDeleted = query.includeDeleted === 'true';

		const result = await CatalogsService.list(catalogName, filters, include, includeDeleted);
		return result;
	}

	async getById() {
		const { catalogName, id } = this.getParams();
		const query = this.getQuery();
		const include = query.include === 'true';
		const includeDeleted = query.includeDeleted === 'true';

		const result = await CatalogsService.getById(catalogName, id, include, includeDeleted);
		return result;
	}

	async create() {
		const { catalogName } = this.getParams();
		const body = this.getBody();

		const result = await CatalogsService.create(catalogName, body);
		return this.created(result);
	}

	async update() {
		const { catalogName, id } = this.getParams();
		const body = this.getBody();

		const result = await CatalogsService.update(catalogName, id, body);
		return this.updated(result);
	}

	async remove() {
		const { catalogName, id } = this.getParams();

		await CatalogsService.remove(catalogName, id);
		return this.noContent();
	}

	async restore() {
		const { catalogName, id } = this.getParams();

		await CatalogsService.restore(catalogName, id);
		return this.noContent();
	}
}

export default new CatalogsController();
