import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';
import { movieImagesService } from '@services/movie-images.service.js';

class MoviesController extends ControllerBase {
	constructor() {
		super();
	}

	// GET /api/v1/movies  — HU-APP-WEB-06 cartelera pública
	async findAll() {
		const data = await MoviesService.getBillboard(this.getQueryFilters());
		return data;
	}

	// GET /api/v1/movies/:id  — HU-APP-WEB-07 detalle público
	async findById() {
		const { id } = this.getParams();
		const data = await MoviesService.getMovieDetail(Number(id));
		return this.success(data, 'Película obtenida exitosamente');
	}

	async findInCartelera() {
		const data = await MoviesService.getBillboard(this.getQueryFilters());
		return this.success(data, 'Cartelera obtenida exitosamente');
	}

	// POST /api/v1/movies  — HU-OPERATIVA-12/13 admin
	// Content-Type: multipart/form-data
	// Campos de texto: title, durationMinutes, ageClassification, lifecycleState,
	//                  synopsis, releaseDate, trailerUrl, genres (JSON array como string)
	// Campos de archivo: poster (imagen), banner (imagen)
	async create() {
		const body = this.getBody();
		const req = this.getRequest();

		// Extraer archivos de imagen del request multipart
		const imageFiles = movieImagesService.extractFromRequest(req.files as any);

		// Validar formato de URL del tráiler (campo de texto, no archivo)
		movieImagesService.validateTrailerUrl(body.trailerUrl);

		// Subir imágenes a ImageKit y obtener las URLs resultantes
		const { posterUrl, bannerUrl } = await movieImagesService.uploadMovieImages(imageFiles);

		// genres puede llegar como string JSON desde multipart
		const genres = typeof body.genres === 'string' ? JSON.parse(body.genres) : body.genres;

		const data = await MoviesService.createMovie({
			...body,
			genres,
			posterUrl: posterUrl ?? body.posterUrl ?? undefined,
			bannerUrl: bannerUrl ?? body.bannerUrl ?? undefined,
		});

		return this.created(data, 'Película registrada exitosamente en el catálogo.');
	}

	// PUT /api/v1/movies/:id  — HU-OPERATIVA-13 edición admin
	// Acepta multipart/form-data igual que create (imágenes opcionales)
	async update() {
		const { id } = this.getParams();
		const body = this.getBody();
		const req = this.getRequest();

		// Extraer y subir imágenes si se enviaron en el update
		const imageFiles = movieImagesService.extractFromRequest(req.files as any);
		movieImagesService.validateTrailerUrl(body.trailerUrl);
		const { posterUrl, bannerUrl } = await movieImagesService.uploadMovieImages(imageFiles);

		const genres = typeof body.genres === 'string' ? JSON.parse(body.genres) : body.genres;

		await MoviesService.updateMovie(Number(id), {
			...body,
			genres,
			// Solo sobreescribir si se subió una imagen nueva
			...(posterUrl && { posterUrl }),
			...(bannerUrl && { bannerUrl }),
		});

		return this.success(null, 'Datos de la película actualizados exitosamente.');
	}

	// DELETE /api/v1/movies/:id  — HU-OPERATIVA-13 desactivación admin
	async remove() {
		const { id } = this.getParams();
		await MoviesService.deleteMovie(Number(id));
		return this.success(null, 'Película retirada del catálogo exitosamente.');
	}
}

export default new MoviesController();
