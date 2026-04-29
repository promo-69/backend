import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Database } from '@database/index.js';
import { tokenBlacklistService } from '@services/token-blacklist.service.js';
import JWTUtil from '@utils/jwt.util.js';
import { AppConfig } from '@config/app.config.js';
import moviesRoute from '@modules/movies/_.route.js';

const app = express();
app.use(express.json());

// Mocking auth middleware via intercepting JWT
app.use((req, res, next) => {
    req.headers.authorization = 'Bearer valid_token';
    next();
});

app.use('/api/movies', moviesRoute);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.statusCode || err.status || 500).json(err.toJSON ? err.toJSON() : { error: err.message, name: err.name, code: err.code });
});

type MockRepo = {
    getFull?: jest.Mock<any>;
    getAllOnBillboard?: jest.Mock<any>;
    getByTitle?: jest.Mock<any>;
    getById?: jest.Mock<any>;
    create?: jest.Mock<any>;
    update?: jest.Mock<any>;
    transaction?: jest.Mock<any>;
    bulkCreate?: jest.Mock<any>;
    deleteByMovie?: jest.Mock<any>;
    count?: jest.Mock<any>;
    getByRolesWithExceptions?: jest.Mock<any>;
};

describe('Movies Route Integration Suite', () => {
    let mockMovies: MockRepo;
    let mockMovieGenres: MockRepo;
    let mockGenres: MockRepo;
    let mockAgeClassifications: MockRepo;
    let mockPermissions: MockRepo;

    beforeEach(() => {
        jest.clearAllMocks();
        AppConfig.clearCache();
        process.env.SESSION_TRANSMISSION_METHOD = 'bearer';

        mockMovies = {
            getFull: jest.fn(),
            getAllOnBillboard: jest.fn(),
            getByTitle: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            transaction: jest.fn().mockImplementation(async (cb: any) => cb({}))
        };

        mockMovieGenres = {
            bulkCreate: jest.fn(),
            deleteByMovie: jest.fn()
        };

        mockGenres = {
            getById: jest.fn()
        };

        mockAgeClassifications = {
            getById: jest.fn()
        };

        mockPermissions = {
            getByRolesWithExceptions: jest.fn().mockResolvedValue({ rows: [] })
        };

        jest.spyOn(Database, 'repository').mockImplementation((connector: string, name: string) => {
            if (name === 'movies') return mockMovies;
            if (name === 'movie-genres') return mockMovieGenres;
            if (name === 'genres') return mockGenres;
            if (name === 'age-classifications') return mockAgeClassifications;
            if (name === 'permissions') return mockPermissions;
            return {};
        });

        jest.spyOn(JWTUtil, 'verifyToken').mockReturnValue({ jti: 'test-jti', exp: 9999999999, userId: 1, userType: 1 } as any);
        jest.spyOn(tokenBlacklistService, 'isBlacklisted').mockResolvedValue(false);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('POST /api/movies', () => {
        const validBody = {
            title: 'Avatar',
            duration_minutes: 120,
            age_classification: 1,
            lifecycle_state: 1,
            synopsis: 'Blue aliens',
            release_date: '2009-12-18',
            genres: [1]
        };

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app).post('/api/movies').send({ title: 'Movie' });
            expect(response.status).toBe(400);
            expect(response.body.name).toBe('ValidationError');
        });

        it('should return 201 when movie is successfully created', async () => {
            mockMovies.getByTitle!.mockResolvedValue(null);
            mockAgeClassifications.getById!.mockResolvedValue({ id: 1 });
            mockGenres.getById!.mockResolvedValue({ id: 1 });
            mockMovies.create!.mockResolvedValue({ id: 1, title: 'Avatar' });

            const response = await request(app).post('/api/movies').send(validBody);

            expect(response.status).toBe(201);
            expect(response.body.data.movie_id).toBe(1);
            expect(response.body.data.title).toBe('Avatar');
        });
    });

    describe('GET /api/movies/cartelera', () => {
        it('should return 200 and list of billboard movies', async () => {
            mockMovies.getAllOnBillboard!.mockResolvedValue({ rows: [{ id: 1, title: 'Avatar' }], count: 1 });

            const response = await request(app).get('/api/movies/cartelera');

            expect(response.status).toBe(200);
            expect(response.body.data.rows[0].title).toBe('Avatar');
        });
    });
});
