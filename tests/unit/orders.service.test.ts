import { jest } from '@jest/globals';
import OrdersService from '../../src/modules/orders/_.service.js';
import { Database } from '../../src/database/index.js';
import { NotFoundError } from '../../src/shared/errors/index.js';
import { Logger } from '../../src/shared/utils/logger.util.js';

describe('OrdersService QR endpoints', () => {
	let repositorySpy: jest.SpyInstance;
	let loggerErrorSpy: jest.SpyInstance;
	let loggerInfoSpy: jest.SpyInstance;
	const mockOrder = { id: 123, qr_code: 'QR-123', concessions_validated_at: null, tickets_validated_at: null };
	const mockTickets = [{ id: 1, order: 123, seat: 78 }];
	const mockOrderLines = [{ id: 2, order: 123, quantity: 2 }];

	beforeEach(() => {
		repositorySpy = jest
			.spyOn(Database, 'repository')
			.mockImplementation((connectorName: string, repoName: string) => {
				if (connectorName === 'main' && repoName === 'orders') {
					return { getOne: jest.fn().mockResolvedValue(mockOrder) };
				}

				if (connectorName === 'main' && repoName === 'tickets') {
					return { getAll: jest.fn().mockResolvedValue(mockTickets) };
				}

				if (connectorName === 'main' && repoName === 'order-lines') {
					return { getAll: jest.fn().mockResolvedValue(mockOrderLines) };
				}

				throw new Error(`Unexpected repository ${connectorName}.${repoName}`);
			});

		loggerErrorSpy = jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
		loggerInfoSpy = jest.spyOn(Logger, 'info').mockImplementation(() => undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns concessions with relations via getConcessionsByQr', async () => {
		const orderLinesRepo = { getAll: jest.fn().mockResolvedValue(mockOrderLines) };
		repositorySpy.mockImplementation((connectorName: string, repoName: string) => {
			if (connectorName === 'main' && repoName === 'orders')
				return { getOne: jest.fn().mockResolvedValue(mockOrder) };
			if (connectorName === 'main' && repoName === 'order-lines') return orderLinesRepo;
			if (connectorName === 'main' && repoName === 'tickets') return { getAll: jest.fn() };
			throw new Error(`Unexpected repository ${connectorName}.${repoName}`);
		});

		const result = await (OrdersService as any).getConcessionsByQr('QR-123');

		expect(orderLinesRepo.getAll).toHaveBeenCalledWith(
			{
				count: false,
				relations: [
					{ association: '_Products', required: false },
					{ association: '_Combos', required: false },
					{ association: '_LineTypes', required: false },
				],
			},
			{ order: mockOrder.id },
		);
		expect(result).toEqual({ concessions: mockOrderLines, concessions_used: false });
	});

	it('returns tickets with nested RoomBookings relations via getTicketsByQr', async () => {
		const ticketsRepo = { getAll: jest.fn().mockResolvedValue(mockTickets) };
		repositorySpy.mockImplementation((connectorName: string, repoName: string) => {
			if (connectorName === 'main' && repoName === 'orders')
				return { getOne: jest.fn().mockResolvedValue(mockOrder) };
			if (connectorName === 'main' && repoName === 'tickets') return ticketsRepo;
			if (connectorName === 'main' && repoName === 'order-lines') return { getAll: jest.fn() };
			throw new Error(`Unexpected repository ${connectorName}.${repoName}`);
		});

		const result = await (OrdersService as any).getTicketsByQr('QR-123');

		expect(ticketsRepo.getAll).toHaveBeenCalledWith(
			{
				count: false,
				relations: [
					{ association: '_Seats', required: false },
					{
						association: '_RoomBookings',
						required: false,
						nested: [{ association: '_Showtimes', required: false }],
					},
				],
			},
			{ order: mockOrder.id },
		);
		expect(result).toEqual({ tickets: mockTickets, tickets_used: false });
	});

	it('throws NotFoundError when qr code is invalid', async () => {
		repositorySpy.mockImplementation((connectorName: string, repoName: string) => {
			if (connectorName === 'main' && repoName === 'orders') return { getOne: jest.fn().mockResolvedValue(null) };
			return { getAll: jest.fn() };
		});

		await expect((OrdersService as any).getConcessionsByQr('INVALID')).rejects.toBeInstanceOf(NotFoundError);
		await expect((OrdersService as any).getTicketsByQr('INVALID')).rejects.toBeInstanceOf(NotFoundError);
	});
});
