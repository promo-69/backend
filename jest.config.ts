import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    testMatch: ['**/tests/**/*.test.ts', '**/*.spec.ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    moduleNameMapper: {
        // Automatically rewrite .js imports in ESM so they map to the TS source
        '^(\\.{1,2}/.*)\\.js$': '$1',
        
        // Modules that end in .js
        '^@config/(.*)\\.js$': '<rootDir>/src/config/$1',
        '^@database/(.*)\\.js$': '<rootDir>/src/database/$1',
        '^@db-connectors/(.*)\\.js$': '<rootDir>/src/database/connectors/$1',
        '^@migrations/(.*)\\.js$': '<rootDir>/src/database/migrations/$1',
        '^@models/(.*)\\.js$': '<rootDir>/src/database/models/$1',
        '^@repositories/(.*)\\.js$': '<rootDir>/src/database/repositories/$1',
        '^@modules/(.*)\\.js$': '<rootDir>/src/modules/$1',
        '^@bases/(.*)\\.js$': '<rootDir>/src/core/bases/$1',
        '^@rules/(.*)\\.js$': '<rootDir>/src/core/types/$1',
        '^@errors/(.*)\\.js$': '<rootDir>/src/shared/errors/$1',
        '^@middlewares/(.*)\\.js$': '<rootDir>/src/shared/middlewares/$1',
        '^@utils/(.*)\\.js$': '<rootDir>/src/shared/utils/$1',
        '^@providers/(.*)\\.js$': '<rootDir>/src/shared/providers/$1',
        '^@tests/(.*)\\.js$': '<rootDir>/tests/$1',

        // Modules that do NOT end in .js (just in case)
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@config$': '<rootDir>/src/config/index.ts',
        '^@database/(.*)$': '<rootDir>/src/database/$1',
        '^@database$': '<rootDir>/src/database/index.ts',
        '^@db-connectors/(.*)$': '<rootDir>/src/database/connectors/$1',
        '^@migrations/(.*)$': '<rootDir>/src/database/migrations/$1',
        '^@models/(.*)$': '<rootDir>/src/database/models/$1',
        '^@repositories/(.*)$': '<rootDir>/src/database/repositories/$1',
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@bases/(.*)$': '<rootDir>/src/core/bases/$1',
        '^@rules/(.*)$': '<rootDir>/src/core/types/$1',
        '^@errors/(.*)$': '<rootDir>/src/shared/errors/$1',
        '^@errors$': '<rootDir>/src/shared/errors/index.ts',
        '^@middlewares/(.*)$': '<rootDir>/src/shared/middlewares/$1',
        '^@utils/(.*)$': '<rootDir>/src/shared/utils/$1',
        '^@providers/(.*)$': '<rootDir>/src/shared/providers/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: 'tsconfig.json',
                isolatedModules: true,
                diagnostics: {
                    ignoreCodes: [151002, 1343]
                }
            },
        ],
    },
};

export default config;
