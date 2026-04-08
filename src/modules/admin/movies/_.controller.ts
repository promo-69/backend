import { ControllerBase } from '@bases/controller.base.js';
import { NotFoundError, ValidationError } from '@errors';
import MoviesService from './_.service.js';

class MoviesController extends ControllerBase {
    async findAll() {
        const data = await MoviesService.findAllMovies(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await MoviesService.findMovieById(Number(id));

        if (!data) {
            throw new NotFoundError('Movie', id);
        }

        return data;
    }

    async findInCartelera() {
        const data = await MoviesService.findMoviesInCartelera(this.getQueryFilters());
        return data;
    }

    async create() {
        const movieData = this.getBody();

        // Validate required fields
        this.requireBodyField('title');
        this.requireBodyField('duration_minutes');
        this.requireBodyField('age_classification');
        this.requireBodyField('lifecycle_state');
        this.requireBodyField('synopsis');
        this.requireBodyField('release_date');

        // Additional validation
        if (!movieData.title || typeof movieData.title !== 'string' || movieData.title.trim().length === 0) {
            throw new ValidationError('Title is required and must be a non-empty string');
        }
        if (!movieData.duration_minutes || typeof movieData.duration_minutes !== 'number' || movieData.duration_minutes <= 0) {
            throw new ValidationError('Duration minutes must be a positive number');
        }
        if (!movieData.synopsis || typeof movieData.synopsis !== 'string' || movieData.synopsis.trim().length === 0) {
            throw new ValidationError('Synopsis is required and must be a non-empty string');
        }

        const data = await MoviesService.createMovie(movieData);
        this.created(data, 'Movie created successfully');
    }

    async update() {
        const { id } = this.getParams();
        const movieData = this.getBody();

        // Check if movie exists
        const existingMovie = await MoviesService.findMovieById(Number(id));
        if (!existingMovie) {
            throw new NotFoundError('Movie', id);
        }

        // Validate fields if provided
        if (movieData.title !== undefined && (!movieData.title || typeof movieData.title !== 'string' || movieData.title.trim().length === 0)) {
            throw new ValidationError('Title must be a non-empty string');
        }
        if (movieData.duration_minutes !== undefined && (typeof movieData.duration_minutes !== 'number' || movieData.duration_minutes <= 0)) {
            throw new ValidationError('Duration minutes must be a positive number');
        }
        if (movieData.synopsis !== undefined && (!movieData.synopsis || typeof movieData.synopsis !== 'string' || movieData.synopsis.trim().length === 0)) {
            throw new ValidationError('Synopsis must be a non-empty string');
        }

        const affectedRows = await MoviesService.updateMovie(Number(id), movieData);
        this.updated({ affectedRows }, 'Movie updated successfully');
    }

    async delete() {
        const { id } = this.getParams();

        // Check if movie exists
        const existingMovie = await MoviesService.findMovieById(Number(id));
        if (!existingMovie) {
            throw new NotFoundError('Movie', id);
        }

        await MoviesService.deleteMovie(Number(id));
        this.noContent();
    }
}

export default new MoviesController();
