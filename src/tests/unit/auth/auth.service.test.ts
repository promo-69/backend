import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Database } from '../../../database/index.js';
import AuthService from '../../../modules/auth/_.service.js';
import JWTUtil from '../../../shared/utils/jwt.util.js';
import { AuthError, ValidationError } from '../../../shared/errors/index.js';
import { BcryptUtil } from '../../../shared/utils/bcrypt.util.js';
import { emailService } from '../../../shared/services/email.service.js';

type MockRepo = {
	getByEmail: jest.Mock<any>;
	getFull: jest.Mock<any>;
	create: jest.Mock<any>;
	update: jest.Mock<any>;
};

describe('AuthService Suite', () => {
	let mockUsers: MockRepo;
	let mockUsersLogins: MockRepo;

	beforeEach(() => {
		jest.clearAllMocks();

		mockUsers = {
			getByEmail: jest.fn(),
			getFull: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		};

		mockUsersLogins = {
			getByEmail: jest.fn(),
			getFull: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		};

		jest.spyOn(Database, 'repository').mockImplementation((connector: string, name: string) => {
			if (name === 'users') return mockUsers;
			if (name === 'users-logins') return mockUsersLogins;
			return {
				getByRolesWithExceptions: jest.fn().mockResolvedValue({ rows: [] }),
			};
		});

		jest.spyOn(emailService, 'sendVerificationCode').mockResolvedValue(undefined as any);
		jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(undefined as any);
		jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined as any);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('authenticateUser', () => {
		it('should throw ValidationError if no email or password are provided', async () => {
			await expect(AuthService.authenticateUser({ email: '', password: '' })).rejects.toThrow(ValidationError);
		});

		it('should throw ValidationError if email or password patterns are invalid', async () => {
			await expect(AuthService.authenticateUser({ email: 'usr', password: '123' })).rejects.toThrow(
				ValidationError,
			);
		});

		it('should throw AuthError if credentials do not match any user', async () => {
			mockUsers.getByEmail.mockResolvedValueOnce(null);

			await expect(
				AuthService.authenticateUser({ email: 'valid_user@example.com', password: 'ValidPassword1!' }),
			).rejects.toThrow(AuthError);

			expect(mockUsers.getByEmail).toHaveBeenCalledWith('valid_user@example.com');
		});

		it('should return valid session data for a verified user', async () => {
			const hashedPassword = await BcryptUtil.hash('ValidPassword1!');
			const fakeUserObj = {
				id: 1,
				email: 'valid_user@example.com',
				document_number: '12345678',
				password: hashedPassword,
				signup_verified_at: new Date(),
				user_type: 2,
				_People: { first_name: 'John', last_name: 'Doe' },
			};

			mockUsers.getByEmail.mockResolvedValueOnce(fakeUserObj);

			jest.spyOn(JWTUtil, 'generateToken').mockReturnValue('mocked_access_token');
			jest.spyOn(JWTUtil, 'generateRefreshToken').mockReturnValue('mocked_refresh_token');
			jest.spyOn(JWTUtil, 'decodeToken').mockReturnValue({ jti: 'test-jti', exp: 9999999999 });

			const result = await AuthService.authenticateUser({
				email: 'valid_user@example.com',
				password: 'ValidPassword1!',
			});

			expect(result.accessToken).toBe('mocked_access_token');
			expect(result.refreshToken).toBe('mocked_refresh_token');
			expect(result.user).toMatchObject({
				userId: 1,
				email: 'valid_user@example.com',
				firstName: 'John',
				lastName: 'Doe',
			});
		});
	});
});
