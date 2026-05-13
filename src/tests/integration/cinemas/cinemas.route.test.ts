import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Database } from '@database/index.js';
import { tokenBlacklistService } from '@services/token-blacklist.service.js';
import JWTUtil from '@utils/jwt.util.js';
import { AppConfig } from '@config/app.config.js';
import cinemasRoute from '@modules/cinemas/_.route.js';

const app = express();
app.use(express.json());

// Mocking auth middleware via intercepting JWT
app.use((req, res, next) => {
	req.headers.authorization = 'Bearer valid_token';
	next();
});

app.use('/api/cinemas', cinemasRoute);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	res.status(err.statusCode || err.status || 500).json(
		err.toJSON ? err.toJSON() : { error: err.message, name: err.name, code: err.code },
	);
});

type MockRepo = {
	getByName?: jest.Mock<any>;
	getFull?: jest.Mock<any>;
	getAllFull?: jest.Mock<any>;
	getAllByCinema?: jest.Mock<any>;
	create?: jest.Mock<any>;
	update?: jest.Mock<any>;
	getByRolesWithExceptions?: jest.Mock<any>;
};

describe('Cinemas Route Integration Suite', () => {
	let mockCinemas: MockRepo;
	let mockRooms: MockRepo;
	let mockAuditLogs: MockRepo;
	let mockPermissions: MockRepo;

	beforeEach(() => {
		jest.clearAllMocks();
		AppConfig.clearCache();
		process.env.SESSION_TRANSMISSION_METHOD = 'bearer';

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

		mockPermissions = {
			getByRolesWithExceptions: jest.fn().mockResolvedValue({ rows: [] }),
		};

		jest.spyOn(Database, 'repository').mockImplementation((connector: string, name: string) => {
			if (name === 'cinemas') return mockCinemas;
			if (name === 'rooms') return mockRooms;
			if (name === 'catalog-audit-logs') return mockAuditLogs;
			if (name === 'permissions') return mockPermissions;
			return {};
		});

		jest.spyOn(JWTUtil, 'verifyToken').mockReturnValue({
			jti: 'test-jti',
			exp: 9999999999,
			userId: 1,
			userType: 1,
		} as any);
		jest.spyOn(tokenBlacklistService, 'isBlacklisted').mockResolvedValue(false);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('POST /api/cinemas', () => {
		it('should return 400 if required fields are missing', async () => {
			const response = await request(app).post('/api/cinemas').send({ name: 'Cine' });
			expect(response.status).toBe(400);
			expect(response.body.name).toBe('ValidationError');
		});

		it('should return 201 when cinema is successfully created', async () => {
			mockCinemas.getByName!.mockResolvedValue(null);
			mockCinemas.create!.mockResolvedValue({ id: 1, name: 'Cineplex' });
			mockCinemas.getFull!.mockResolvedValue({ id: 1, name: 'Cineplex', status: 1 });

			const response = await request(app).post('/api/cinemas').send({
				name: 'Cineplex',
				openingTime: '08:00',
				closingTime: '23:00',
			});

			expect(response.status).toBe(201);
			expect(response.body.data.id).toBe(1);
			expect(response.body.data.name).toBe('Cineplex');
		});
	});
});
