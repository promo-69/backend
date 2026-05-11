import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Database } from '@database/index.js';
import CinemasService from '@modules/cinemas/_.service.js';
import { ConflictError, NotFoundError, ValidationError } from '@errors';

type MockRepo = {
	getByName?: jest.Mock<any>;
	getFull?: jest.Mock<any>;
	getAllFull?: jest.Mock<any>;
	getAllByCinema?: jest.Mock<any>;
	create?: jest.Mock<any>;
	update?: jest.Mock<any>;
};

describe('CinemasService Unit Suite', () => {
	let mockCinemas: MockRepo;
	let mockRooms: MockRepo;
	let mockAuditLogs: MockRepo;

	beforeEach(() => {
		jest.clearAllMocks();

		mockCinemas = {
			getByName: jest.fn(),
			getFull: jest.fn(),
			getAllFull: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		};

		mockRooms = {
			getAllByCinema: jest.fn(),
		};

		mockAuditLogs = {
			create: jest.fn(),
		};

		jest.spyOn(Database, 'repository').mockImplementation((connector: string, name: string) => {
			if (name === 'cinemas') return mockCinemas;
			if (name === 'rooms') return mockRooms;
			if (name === 'catalog-audit-logs') return mockAuditLogs;
			return {};
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('createCinema', () => {
		it('should throw ValidationError if required fields are missing', async () => {
			await expect(
				CinemasService.createCinema({ name: '', openingTime: '10:00', closingTime: '22:00' }),
			).rejects.toThrow(ValidationError);
		});

		it('should throw ValidationError if time format is invalid', async () => {
			await expect(
				CinemasService.createCinema({ name: 'Cine', openingTime: '10:0', closingTime: '22:00' }),
			).rejects.toThrow(ValidationError);
		});

		it('should throw ConflictError if cinema name already exists and is active', async () => {
			mockCinemas.getByName!.mockResolvedValueOnce({ id: 1, name: 'Cineplex', status: 1 });
			await expect(
				CinemasService.createCinema({ name: 'Cineplex', openingTime: '10:00', closingTime: '22:00' }),
			).rejects.toThrow(ConflictError);
		});

		it('should create cinema and audit log successfully', async () => {
			mockCinemas.getByName!.mockResolvedValueOnce(null);
			mockCinemas.create!.mockResolvedValueOnce({ id: 10, name: 'Cineplex' });
			mockCinemas.getFull!.mockResolvedValueOnce({ id: 10, name: 'Cineplex', status: 1 });

			const result = await CinemasService.createCinema({
				name: 'Cineplex',
				openingTime: '10:00',
				closingTime: '22:00',
			});

			expect(mockCinemas.create).toHaveBeenCalled();
			expect(mockAuditLogs.create).toHaveBeenCalled();
			expect(result.id).toBe(10);
		});
	});

	describe('updateCinema', () => {
		it('should throw NotFoundError if cinema does not exist', async () => {
			mockCinemas.getFull!.mockResolvedValueOnce(null);
			await expect(CinemasService.updateCinema(99, { name: 'New' })).rejects.toThrow(NotFoundError);
		});

		it('should update cinema successfully', async () => {
			mockCinemas.getFull!.mockResolvedValueOnce({
				id: 1,
				name: 'Old',
				status: 1,
				opening_time: '10:00',
				closing_time: '22:00',
			});
			mockCinemas.getByName!.mockResolvedValueOnce(null);
			mockCinemas.update!.mockResolvedValueOnce([1]);
			mockCinemas.getFull!.mockResolvedValueOnce({ id: 1, name: 'New', status: 1 });

			const result = await CinemasService.updateCinema(1, { name: 'New' });

			expect(mockCinemas.update).toHaveBeenCalledWith(1, { name: 'New' });
			expect(mockAuditLogs.create).toHaveBeenCalled();
			expect(result.name).toBe('New');
		});
	});

	describe('deleteCinema', () => {
		it('should throw ConflictError if cinema has active rooms', async () => {
			mockCinemas.getFull!.mockResolvedValueOnce({ id: 1, status: 1 });
			mockRooms.getAllByCinema!.mockResolvedValueOnce({ rows: [{ id: 1 }] });

			await expect(CinemasService.deleteCinema(1)).rejects.toThrow(ConflictError);
		});

		it('should mark cinema as deleted successfully', async () => {
			mockCinemas.getFull!.mockResolvedValueOnce({ id: 1, status: 1 });
			mockRooms.getAllByCinema!.mockResolvedValueOnce({ rows: [] });

			const result = await CinemasService.deleteCinema(1);

			expect(mockCinemas.update).toHaveBeenCalledWith(1, { status: 4 });
			expect(result.deleted).toBe(true);
		});
	});
});
