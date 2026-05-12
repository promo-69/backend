import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Database } from '@database/index.js';
import JWTUtil from '@utils/jwt.util.js';
import { AppConfig } from '@config/app.config.js';
import authRoute from '@modules/auth/_.route.js';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { tokenBlacklistService } from '@services/token-blacklist.service.js';
import { emailService } from '@services/email.service.js';

// Setup Test App
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoute);

// Global Error Handler Simulation to catch and output validation/auth formatted errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	res.status(err.statusCode || err.status || 500).json(
		err.toJSON ? err.toJSON() : { error: err.message, name: err.name, code: err.code },
	);
});

type MockRepo = {
	getByEmail: jest.Mock<any>;
	getFull: jest.Mock<any>;
	create: jest.Mock<any>;
	update: jest.Mock<any>;
	transaction: jest.Mock<any>;
};

describe('Auth Route Integration Suite', () => {
	let mockUsers: MockRepo;
	let mockUsersLogins: MockRepo;

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset the environment variable for each test
		process.env.SESSION_TRANSMISSION_METHOD = 'cookie';
		AppConfig.clearCache();

		mockUsers = {
			getByEmail: jest.fn(),
			getFull: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			transaction: jest.fn(),
		};
		mockUsersLogins = {
			getByEmail: jest.fn(),
			getFull: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			transaction: jest.fn(),
		};

		jest.spyOn(Database, 'repository').mockImplementation((connector: string, name: string) => {
			if (name === 'users') return mockUsers;
			if (name === 'users-logins') return mockUsersLogins;
			return {
				create: jest.fn(),
				update: jest.fn(),
			};
		});

		jest.spyOn(emailService, 'sendVerificationCode').mockResolvedValue(undefined as any);
		jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(undefined as any);
		jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined as any);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('POST /api/auth/login', () => {
		it('should return 400 Bad Request if credentials are not provided or invalid format', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: '', password: '' });

			expect(response.status).toBe(400);
			expect(response.body.name).toBe('ValidationError');
		});

		it('should return 400 Bad Request if regex validations fail', async () => {
			const response = await request(app)
				.post('/api/auth/login')
				.send({ email: 'invalid_email', password: '123' });

			expect(response.status).toBe(400);
			expect(response.body.name).toBe('ValidationError');
		});

		it('should return 401 Unauthorized if database rejects credentials', async () => {
			mockUsers.getByEmail.mockResolvedValueOnce(null);

			const response = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test@example.com', password: 'Password1!' });

			expect(response.status).toBe(401);
			expect(response.body.code).toBe('INVALID_LOGIN');
		});

		it('should return 200 OK and emit JWT in Response JSON body when transmission is BEARER', async () => {
			process.env.SESSION_TRANSMISSION_METHOD = 'bearer';
			AppConfig.clearCache();

			const hashedPassword = await BcryptUtil.hash('Password1!');

			mockUsers.getByEmail.mockImplementation(async (e) => {
				return {
					id: 1,
					email: 'test@example.com',
					password: hashedPassword,
					signup_verified_at: new Date(),
					_People: { first_name: 'John', last_name: 'Doe' },
					user_type: 2,
				};
			});

			jest.spyOn(JWTUtil, 'generateToken').mockReturnValue('fake_jwt_token_bearer');
			jest.spyOn(JWTUtil, 'generateRefreshToken').mockReturnValue('fake_jwt_refresh_bearer');
			jest.spyOn(JWTUtil, 'decodeToken').mockReturnValue({ jti: 'test-jti', exp: 9999999999 });

			const response = await request(app)
				.post('/api/auth/login')
				.send({ email: 'test@example.com', password: 'Password1!' });

			expect(response.status).toBe(200);
			expect(response.body.message).toMatch(/Autenticación exitosa/i);
			expect(response.body.data.tokens.accessToken).toBe('fake_jwt_token_bearer');
			expect(response.body.data.tokens.refreshToken).toBe('fake_jwt_refresh_bearer');
			expect(response.body.data.user.email).toBe('test@example.com');
		});
	});
});
