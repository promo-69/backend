import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Database } from '../../../src/database/index.js';
import JWTUtil from '../../../src/shared/utils/jwt.util.js';
import { AppConfig } from '../../../src/config/app.config.js';
import authRoute from '../../../src/modules/auth/_.route.js';

// Setup Test App
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoute);

// Global Error Handler Simulation to catch and output validation/auth formatted errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(
        `\n[Integrations: Caught error ${err.name}]\nCode: ${err.code}\nStatus: ${err.statusCode || err.status}\nMessage: ${err.message}\nJSON Format: ${typeof err.toJSON === 'function'}\n`,
    );
    res.status(err.statusCode || err.status || 500).json(err.toJSON ? err.toJSON() : { error: err.message });
});

type MockRepo = {
    getByCredentials: jest.Mock<any>;
    getFullByUser: jest.Mock<any>;
    getFullByRole: jest.Mock<any>;
};

describe('Auth Route Integration Suite', () => {
    let mockAuthAccesosSistemas: MockRepo;
    let mockAuthRolesUsuarios: MockRepo;
    let mockAuthRolesPermisos: MockRepo;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset the environment variable for each test
        process.env.SESSION_TRANSMISSION_METHOD = 'cookie';
        AppConfig.clearCache();

        mockAuthAccesosSistemas = { getByCredentials: jest.fn(), getFullByUser: jest.fn(), getFullByRole: jest.fn() };
        mockAuthRolesUsuarios = { getByCredentials: jest.fn(), getFullByUser: jest.fn(), getFullByRole: jest.fn() };
        mockAuthRolesPermisos = { getByCredentials: jest.fn(), getFullByUser: jest.fn(), getFullByRole: jest.fn() };

        jest.spyOn(Database, 'repository').mockImplementation((connector: string, name: string) => {
            if (name === 'auth-accesos-sistema') return mockAuthAccesosSistemas;
            if (name === 'auth-roles-usuarios') return mockAuthRolesUsuarios;
            if (name === 'auth-roles-permisos') return mockAuthRolesPermisos;
            return {};
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 Bad Request if credentials are not provided or invalid format', async () => {
            const response = await request(app).post('/api/auth/login').send({ uid: '', password: '' });

            expect(response.status).toBe(400);
            expect(response.body.name).toBe('ValidationError');
        });

        it('should return 401 Unauthorized if database rejects credentials', async () => {
            mockAuthAccesosSistemas.getByCredentials.mockResolvedValueOnce(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ uid: 'wrong_user', password: 'wrong_password' });

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_LOGIN');
        });

        it('should return 200 OK and inject JWT into Set-Cookie header when transmission is COOKIE', async () => {
            process.env.SESSION_TRANSMISSION_METHOD = 'cookie';

            mockAuthAccesosSistemas.getByCredentials.mockResolvedValueOnce({ id: 1, usuario: 'admin' });
            mockAuthRolesUsuarios.getFullByUser.mockResolvedValueOnce({ rows: [] });

            jest.spyOn(JWTUtil, 'generateToken').mockReturnValue('fake_jwt_token_cookie');
            jest.spyOn(JWTUtil, 'generateRefreshToken').mockReturnValue('fake_jwt_refresh_cookie');

            const response = await request(app).post('/api/auth/login').send({ uid: 'admin', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/Autenticación exitosa/i);

            // Check that Set-Cookie headers exist and contain our generated tokens
            const setCookieHeader = response.header['set-cookie'];
            const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
            expect(cookies).toBeDefined();
            expect(cookies.some((c: string) => c?.includes('access_token=fake_jwt_token_cookie'))).toBe(true);

            // Data shouldn't leak the token in the body
            expect(response.body.data.token).toBeUndefined();
        });

        it('should return 200 OK and emit JWT in Response JSON body when transmission is BEARER', async () => {
            process.env.SESSION_TRANSMISSION_METHOD = 'bearer';
            AppConfig.clearCache();

            mockAuthAccesosSistemas.getByCredentials.mockResolvedValueOnce({ id: 1, usuario: 'admin' });
            mockAuthRolesUsuarios.getFullByUser.mockResolvedValueOnce({ rows: [] });

            jest.spyOn(JWTUtil, 'generateToken').mockReturnValue('fake_jwt_token_bearer');
            jest.spyOn(JWTUtil, 'generateRefreshToken').mockReturnValue('fake_jwt_refresh_bearer');

            const response = await request(app).post('/api/auth/login').send({ uid: 'admin', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/Autenticación exitosa/i);

            // Ensure headers don't strictly contain tokens unless fallback, but body must contain it
            expect(response.body.data.accessToken).toBe('fake_jwt_token_bearer');
            expect(response.body.data.refreshToken).toBe('fake_jwt_refresh_bearer');
            expect(response.body.data.user.uid).toBe('admin');
        });
    });
});
