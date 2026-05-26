import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Database } from '@database/index.js';
import MoviesService from '@modules/movies/_.service.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';

type MockRepo = {
	getFull?: jest.Mock<any>;
	getByTitle?: jest.Mock<any>;
	getById?: jest.Mock<any>;
	create?: jest.Mock<any>;
	update?: jest.Mock<any>;
	delete?: jest.Mock<any>;
	transaction?: jest.Mock<any>;
	bulkCreate?: jest.Mock<any>;
	deleteByMovie?: jest.Mock<any>;
	count?: jest.Mock<any>;
};

describe('MoviesService Unit Suite', () => {
	let mockMovies: MockRepo;
	let mockMovieGenres: MockRepo;
	let mockGenres: MockRepo;
	let mockAgeClassifications: MockRepo;
	let mockShowtimes: MockRepo;

	beforeEach(() => {
		jest.clearAllMocks();

		mockMovies = {
			getFull: jest.fn(),
			getByTitle: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			transaction: jest.fn().mockImplementation(async (cb: any) => cb({})),
		};

		mockMovieGenres = {
			bulkCreate: jest.fn(),
			deleteByMovie: jest.fn(),
		};

		mockGenres = {
			getById: jest.fn(),
		};

		mockAgeClassifications = {
			getById: jest.fn(),
		};

		mockShowtimes = {
			count: jest.fn(),
		};

		jest.spyOn(Database, 'repository').mockImplementation((connector: string, name: string) => {
			if (name === 'movies') return mockMovies;
			if (name === 'movie-genres') return mockMovieGenres;
			if (name === 'genres') return mockGenres;
			if (name === 'age-classifications') return mockAgeClassifications;
			if (name === 'showtimes') return mockShowtimes;
			return {};
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('createMovie', () => {
		const validBody = {
			title: 'Avatar',
				durationMinutes: 120,
				ageClassification: 1,
				lifecycleState: 1,
				synopsis: 'Blue aliens',
				releaseDate: '2009-12-18',
		it('should throw ValidationError if duration_minutes is invalid', async () => {
			await expect(MoviesService.createMovie({ ...validBody, duration_minutes: 0 })).rejects.toThrow(
				ValidationError,
			);
		});

		it('should throw ValidationError if genres is empty', async () => {
			await expect(MoviesService.createMovie({ ...validBody, genres: [] })).rejects.toThrow(ValidationError);
		});

		it('should throw ConflictError if title already exists', async () => {
			mockMovies.getByTitle!.mockResolvedValueOnce({ id: 1 });
			await expect(MoviesService.createMovie(validBody)).rejects.toThrow(ConflictError);
		});

		it('should create movie and genres', async () => {
			mockMovies.getByTitle!.mockResolvedValueOnce(null);
			mockAgeClassifications.getById!.mockResolvedValueOnce({ id: 1 });
			mockGenres.getById!.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 2 });
			mockMovies.create!.mockResolvedValueOnce({ id: 10, title: 'Avatar' });

			const result = await MoviesService.createMovie(validBody);

			expect(mockMovies.transaction).toHaveBeenCalled();
			expect(mockMovies.create).toHaveBeenCalled();
			expect(mockMovieGenres.bulkCreate).toHaveBeenCalled();
			expect(result.movie_id).toBe(10);
			expect(result.title).toBe('Avatar');
		});
	});

	describe('updateMovie', () => {
		it('should throw NotFoundError if movie not found', async () => {
			mockMovies.getFull!.mockResolvedValueOnce(null);
			await expect(MoviesService.updateMovie(1, { synopsis: 'Test' })).rejects.toThrow(NotFoundError);
		});

		it('should update movie successfully', async () => {
			mockMovies.getFull!.mockResolvedValueOnce({ id: 1, status: 1 });

			await MoviesService.updateMovie(1, { synopsis: 'Updated', genres: [3] });

			expect(mockMovies.update).toHaveBeenCalledWith(1, { synopsis: 'Updated' }, expect.any(Object));
			expect(mockMovieGenres.deleteByMovie).toHaveBeenCalledWith(1, expect.any(Object));
			expect(mockMovieGenres.bulkCreate).toHaveBeenCalled();
		});
	});

	describe('deleteMovie', () => {
		it('should throw ConflictError if active showtimes exist', async () => {
			mockMovies.getFull!.mockResolvedValueOnce({ id: 1, status: 1 });
			mockShowtimes.count!.mockResolvedValueOnce(5);

			await expect(MoviesService.deleteMovie(1)).rejects.toThrow(ConflictError);
		});

		it('should mark movie as deleted', async () => {
			mockMovies.getFull!.mockResolvedValueOnce({ id: 1, status: 1 });
			mockShowtimes.count!.mockResolvedValueOnce(0);

			await MoviesService.deleteMovie(1);

			expect(mockMovies.delete).toHaveBeenCalledWith(1);
		});
	});
});
