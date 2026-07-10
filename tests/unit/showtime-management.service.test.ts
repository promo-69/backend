import { jest } from '@jest/globals';

const roomBookingsRepo = { getAll: jest.fn() };
const showtimesRepo = { getAll: jest.fn() };
const moviesRepo = { getById: jest.fn() };
const lifecycleStatesRepo = { getAll: jest.fn() };
const projectionTypesRepo = { getAll: jest.fn() };
const languagesRepo = { getAll: jest.fn() };
const currenciesRepo = { getAll: jest.fn() };
const seatsRepo = { count: jest.fn() };
const ticketsRepo = { count: jest.fn() };

const repositoryMap: Record<string, any> = {
	'room-bookings': roomBookingsRepo,
	'showtimes': showtimesRepo,
	'movies': moviesRepo,
	'movie-lifecycle-states': lifecycleStatesRepo,
	'projection-types': projectionTypesRepo,
	'languages': languagesRepo,
	'currencies': currenciesRepo,
	'seats': seatsRepo,
	'tickets': ticketsRepo,
};

const repositoryMock = jest.fn((_: string, model: string) => repositoryMap[model]);

jest.unstable_mockModule('../../src/database/index.js', () => ({
	Database: {
		repository: repositoryMock,
	},
	Ops: { gt: 'gt', ne: 'ne', lt: 'lt' },
}));

jest.unstable_mockModule('@errors', () => ({
	ConflictError: class ConflictError extends Error {
		constructor(message: string, code?: string) {
			super(message);
			(this as any).code = code;
		}
	},
	NotFoundError: class NotFoundError extends Error {
		constructor(message: string, code?: string) {
			super(message);
			(this as any).code = code;
		}
	},
	ValidationError: class ValidationError extends Error {
		constructor(message: string, fields?: string[]) {
			super(message);
			(this as any).fields = fields;
		}
	},
}));

jest.unstable_mockModule('@services/pricing.service.js', () => ({
	PricingService: { calculateFinalPrice: jest.fn() },
}));

jest.unstable_mockModule('@services/pricing-cache.service.js', () => ({
	PricingCacheService: { getActiveModifiers: jest.fn() },
}));

jest.unstable_mockModule('@services/shopping-session.service.js', () => ({
	default: { getActiveQuote: jest.fn() },
}));

jest.unstable_mockModule('@constants/magic-vars.constant.js', () => ({
	ORDER_STATUS: {},
}));

jest.unstable_mockModule('@services/movie-lifecycle.service.js', () => ({
	default: { syncMovieLifecycle: jest.fn() },
}));

const { ShowtimeManagementService } = await import('../../src/shared/services/showtime-management.service.js');

describe('ShowtimeManagementService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		lifecycleStatesRepo.getAll.mockResolvedValue([{ id: 2, description: 'En Cartelera (Regular)' }]);
	});

	it('devuelve banner_url de la película en la respuesta de funciones por sucursal', async () => {
		roomBookingsRepo.getAll.mockResolvedValueOnce([
			{
				id: 10,
				room: 1,
				start_time: new Date('2026-07-10T18:00:00.000Z'),
				end_time: new Date('2026-07-10T20:00:00.000Z'),
				_Rooms: { id: 1, name: 'Sala 1', cinema: 2, room_type: 1 },
			},
		]);
		showtimesRepo.getAll.mockResolvedValueOnce([
			{ id: 100, booking: 10, movie: 7, projection_type: 1, language: 1, currency: 1, price: 20, earned_loyalty_points: 0 },
		]);
		moviesRepo.getById.mockResolvedValueOnce({
			id: 7,
			title: 'Test movie',
			duration_minutes: 120,
			poster_url: 'poster.jpg',
			banner_url: 'banner.jpg',
			lifecycle_state: 2,
		});
		projectionTypesRepo.getAll.mockResolvedValueOnce([{ id: 1, description: '2D' }]);
		languagesRepo.getAll.mockResolvedValueOnce([{ id: 1, description: 'Español' }]);
		currenciesRepo.getAll.mockResolvedValueOnce([{ id: 1, code: 'USD', symbol: '$' }]);
		seatsRepo.count.mockResolvedValue(50);
		ticketsRepo.count.mockResolvedValue(5);

		const service = new ShowtimeManagementService();
		const result = await service.getMovieShowtimesByCinema(7, 2);

		expect(result.movie.banner_url).toBe('banner.jpg');
	});
});
