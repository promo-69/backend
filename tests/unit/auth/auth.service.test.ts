import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Database } from '../../../src/database/index.js';
import AuthService from '../../../src/modules/auth/_.service.js';
import JWTUtil from '../../../src/shared/utils/jwt.util.js';
import { AuthError, ValidationError } from '../../../src/shared/errors/index.js';
import type { QueryResult } from '../../../src/core/bases/repository.base.js';

// Removed jest.mock for ESM compatibility. Using jest.spyOn below instead.

type MockRepo = {
    getByCredentials: jest.Mock<any>;
    getFullByUser: jest.Mock<any>;
    getAllActive: jest.Mock<any>;
    getFullByRole: jest.Mock<any>;
    getAllFull: jest.Mock<any>;
};

describe('AuthService Suite', () => {
    let mockAuthAccesosSistemas: MockRepo;
    let mockAuthRolesUsuarios: MockRepo;
    let mockAuthRolesPermisos: MockRepo;

    beforeEach(() => {
        jest.clearAllMocks();

        mockAuthAccesosSistemas = {
            getByCredentials: jest.fn(),
            getFullByUser: jest.fn(),
            getAllActive: jest.fn(),
            getFullByRole: jest.fn(),
            getAllFull: jest.fn()
        };

        mockAuthRolesUsuarios = {
            getByCredentials: jest.fn(),
            getFullByUser: jest.fn(),
            getAllActive: jest.fn(),
            getFullByRole: jest.fn(),
            getAllFull: jest.fn()
        };

        mockAuthRolesPermisos = {
            getByCredentials: jest.fn(),
            getFullByUser: jest.fn(),
            getAllActive: jest.fn(),
            getFullByRole: jest.fn(),
            getAllFull: jest.fn()
        };

        jest.spyOn(Database, 'repository').mockImplementation((connector: string, name: string) => {
            if (name === 'auth-accesos-sistema') return mockAuthAccesosSistemas;
            if (name === 'auth-roles-usuarios') return mockAuthRolesUsuarios;
            if (name === 'auth-roles-permisos') return mockAuthRolesPermisos;
            return {};
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('authenticateUser', () => {
        it('should throw ValidationError if no uid or password are provided', async () => {
            await expect(AuthService.authenticateUser({ uid: '', password: '' }))
                .rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if uid or password patterns are invalid', async () => {
            await expect(AuthService.authenticateUser({ uid: 'usr', password: '123' }))
                .rejects.toThrow(ValidationError);
        });

        it('should throw AuthError if credentials do not match any user', async () => {
            mockAuthAccesosSistemas.getByCredentials.mockResolvedValueOnce(null);

            await expect(AuthService.authenticateUser({ uid: 'valid_user', password: 'valid_password' }))
                .rejects.toThrow(AuthError);
                
            expect(mockAuthAccesosSistemas.getByCredentials).toHaveBeenCalledWith({ usuario: 'valid_user', clave: 'valid_password' });
        });

        it('should return valid session data dynamically pulling nested permissions via simulated Where clauses', async () => {
            const fakeSessionObj = {
                id: 1,
                empleado_responsable: 10,
                unidad_administradora: 20,
                usuario: 'valid_user',
                _UniAdm: { descripcion: 'Administration' },
                _Empleados: { cedula: 'V-12345678', nombres: 'John', apellidos: 'Doe' }
            };

            const fakeRolesData: QueryResult<{ rol: number, _Roles: { id: number, codigo: string } }> = {
                rows: [
                    { rol: 101, _Roles: { id: 101, codigo: 'ADMIN_ROLE' } }
                ]
            };

            const fakePermissionsData: QueryResult<{ _Permisos: { _Recursos: { codigo: string }, _Acciones: { codigo: string }, _TipPer: { codigo: string } } }> = {
                rows: [
                    {
                        _Permisos: {
                            _Recursos: { codigo: 'USERS' },
                            _Acciones: { codigo: 'READ' },
                            _TipPer: { codigo: 'GRANT' }
                        }
                    }
                ]
            };

            mockAuthAccesosSistemas.getByCredentials.mockResolvedValueOnce(fakeSessionObj);
            mockAuthRolesUsuarios.getFullByUser.mockResolvedValueOnce(fakeRolesData);
            mockAuthRolesPermisos.getFullByRole.mockResolvedValueOnce(fakePermissionsData);
            
            jest.spyOn(JWTUtil, 'generateToken').mockReturnValue('mocked_access_token');
            jest.spyOn(JWTUtil, 'generateRefreshToken').mockReturnValue('mocked_refresh_token');

            const result = await AuthService.authenticateUser({ uid: 'valid_user', password: 'valid_password' });

            // Ensure our Mocks interacted nicely with relational strict interfaces
            expect(mockAuthRolesUsuarios.getFullByUser).toHaveBeenCalledWith({ usuario: 1 });
            expect(mockAuthRolesPermisos.getFullByRole).toHaveBeenCalledWith({ rol: 101 });

            expect(result.accessToken).toBe('mocked_access_token');
            expect(result.refreshToken).toBe('mocked_refresh_token');
            expect(result.user).toMatchObject({
                id: 1,
                uid: 'valid_user',
                roles: [{ id: 101, code: 'ADMIN_ROLE' }],
                permissions: ['GRANT:READ:USERS'] // The parsed string representation
            });
        });
    });
});
