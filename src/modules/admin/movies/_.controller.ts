import { ControllerBase } from '@bases/controller.base.js';
import MoviesService from './_.service.js';

class MoviesController extends ControllerBase {
    async findAll() {
        const data = await MoviesService.findAllMovies(this.getQueryFilters());
        return data;
    }

    async findById() {
        const { id } = this.getParams();
        const data = await MoviesService.findMovieById(Number(id));
        return data;
    }

    async create() {
        const movieData = this.getBody();
        const data = await MoviesService.createMovie(movieData);
        this.created(data, 'Movie created successfully');
    }

    async update() {
        const { id } = this.getParams();
        const movieData = this.getBody();
        const affectedRows = await MoviesService.updateMovie(Number(id), movieData);
        this.updated({ affectedRows }, 'Movie updated successfully');
    }

    async delete() {
        const { id } = this.getParams();
        const affectedRows = await MoviesService.deleteMovie(Number(id));
        this.success({ affectedRows }, 'Movie deleted successfully');
    }
}

export default new MoviesController();
