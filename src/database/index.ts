import { type IDatabaseConfig, type IDatabaseHealth } from '@rules/database.type.js';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { DatabaseConfig } from '@config/database.config.js';
import { SequelizeConnector } from '@database/connectors/sequelize.connector.js';
import { Logger } from '@utils/logger.util.js';
import { BaseRepository } from '@bases/repository.base.js';
import { DatabaseRepositoryError } from '@errors/database.error.js';
import { ANSI } from '@utils/ansi.util.js';
import { AppConfig } from '@config/app.config.js';

export { WhereOperators as Ops } from '@bases/repository.base.js';

class DatabaseManager {
    private connectors: Map<string, BaseDatabaseConnector> = new Map();
    private repositories: Map<string, any> = new Map();

    constructor() {}

    async initialize(): Promise<void> {
        await this.initializeConnectors();
        await this.initializeRepositories();
    }

    async initializeConnectors(): Promise<void> {
        if (!AppConfig.load().enableDatabase) return;
        // Mapeamos las configuraciones directamente a promesas
        const promises = DatabaseConfig.loadAll()
            .filter((config) => config.enabled) // Solo los habilitados
            .map(async (config) => {
                Logger.natural(`Trying to connect to '${config.id}' database as '${config.type}' type...`);
                const connector = this.createConnector(config);

                // Si esto falla, la promesa lanzará el error y Promise.all lo capturará
                await connector.connect();

                this.connectors.set(config.id, connector);
                return null;
            });

        if (promises.length > 0) await Promise.all(promises);
        else Logger.natural(ANSI.info(`Enabled databases connectors was not found`));
    }

    async initializeRepositories(): Promise<void> {
        if (!AppConfig.load().enableDatabase) return;

        const dbConfig = DatabaseConfig.loadAll().filter((conf) => conf.enabled);

        // @ts-ignore
        if (typeof import.meta.env !== 'undefined') {
            // Cargar todos los repositorios diferidamente (Lazy Loading para Vite SSR)
            // @ts-ignore
            const repoModules = import.meta.glob('./repositories/*/*.{ts,js}', { eager: false });

            for (const config of dbConfig) {
                let loadedCount = 0;

                for (const pathRepo in repoModules) {
                    // pathRepo example: './repositories/main/auth.repository.ts'
                    const splitted = pathRepo.split('/');
                    const dbInstanceId = splitted[2];
                    const repoFileName = splitted[3];

                    if (dbInstanceId !== config.id) continue;
                    if (/^(index)/.test(repoFileName)) continue; // ignore index files

                    const loadedModule = await repoModules[pathRepo]() as any;
                    let repoDefinition = loadedModule;
                    if (!repoDefinition.default || typeof repoDefinition.default !== 'object') {
                        throw new Error(`Model ${repoFileName} does not export a valid class`);
                    }

                    repoDefinition = repoDefinition.default;
                    
                    // Normaliza el nombre del repositorio ('AuthRepository' => 'auth', etc)
                    const repoRawName = repoDefinition.constructor.name
                        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                        .toLowerCase()
                        .replace('-repository', '');

                    this.repositories.set(`${config.id}.${repoRawName}`, repoDefinition);
                    loadedCount++;
                }

                if (loadedCount > 0) {
                    Logger.natural(
                        ANSI.success(`[+] Repositories for '${config.id}' database as '${config.type}' type loaded`),
                    );
                }
            }
        } else {
            // Fallback dinámico nativo usando FS (Usado exclusivamente para Jest Testing y utilidades script)
            const fs = await import('fs');
            const path = await import('path');
            const { fileURLToPath, pathToFileURL } = await import('url');

            const __dirname = path.dirname(fileURLToPath(import.meta.url));

            for (const config of dbConfig) {
                let loadedCount = 0;
                const repoPath = path.join(__dirname, 'repositories', config.id);

                try { fs.accessSync(repoPath); } catch { continue; }

                const repoNames = fs.readdirSync(repoPath, { withFileTypes: true })
                    .filter((dirent) => dirent.isFile() && !/^(index)/.test(dirent.name) && /\.(js|ts)$/.test(dirent.name))
                    .map((dirent) => dirent.name)
                    .reduce((acu: string[], cur: string) => {
                        const index = acu.findIndex((name: string) => {
                            const onlyName = cur.replace(/\.(ts|js)$/, '.');
                            return name.includes(onlyName);
                        });

                        if (index === -1) acu.push(cur);
                        else if (index !== -1) if (!/\.js$/.test(acu[index]) && /\.js$/.test(cur)) acu[index] = cur;

                        return acu;
                    }, []);

                for (const repoName of repoNames) {
                    const repoFilePath = path.join(repoPath, repoName);
                    const repoUrl = pathToFileURL(repoFilePath);
                    let repoDefinition = await import(repoUrl.toString());

                    if (!repoDefinition.default || typeof repoDefinition.default !== 'object')
                        throw new Error(`Repository ${repoName} does not export a valid instance`);

                    repoDefinition = repoDefinition.default;
                    const repoRawName = repoDefinition.constructor.name
                        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                        .toLowerCase()
                        .replace('-repository', '');

                    this.repositories.set(`${config.id}.${repoRawName}`, repoDefinition);
                    loadedCount++;
                }

                if (loadedCount > 0) {
                    Logger.natural(
                        ANSI.success(`[+] Repositories for '${config.id}' database as '${config.type}' type loaded`),
                    );
                }
            }
        }

        if (dbConfig.length === 0) Logger.natural(ANSI.info(`Enabled databases connectors was not found`));
    }

    private createConnector(config: IDatabaseConfig): BaseDatabaseConnector {
        switch (config.type) {
            case 'postgresql':
            case 'mysql':
                return new SequelizeConnector(config);
            default:
                throw new Error(`Unsupported database type: ${config.type}`);
        }
    }

    getConnector(name: string): BaseDatabaseConnector {
        const connector = this.connectors.get(name);
        if (!connector) throw new Error(`Database connector '${name}' not found`);
        return connector;
    }

    getDefaultConnector(): BaseDatabaseConnector {
        const defaultConfig = DatabaseConfig.loadDefault();
        if (!defaultConfig) throw new Error('No default database configured');
        return this.getConnector(defaultConfig.id);
    }

    repository(connectorName: string, repoName: string): BaseRepository<any, any> {
        const key = `${connectorName}.${repoName}`;

        if (!this.repositories.has(key)) throw new DatabaseRepositoryError('Not found');

        return this.repositories.get(key);
    }

    list(connectorName: string | null = null): Array<{ connectorName: string; repoName: string }> {
        return Array.from(this.repositories.keys()).reduce(
            (
                acu: Array<{ connectorName: string; repoName: string }>,
                cur: string,
            ): Array<{ connectorName: string; repoName: string }> => {
                const [connectorName, repoName] = cur.split('.');

                if (connectorName !== connectorName) return acu;

                acu.push({ connectorName, repoName });

                return acu;
            },
            [] as Array<{ connectorName: string; repoName: string }>,
        );
    }

    async shutdown(): Promise<void> {
        for (const connector of this.connectors.values()) await connector.disconnect();

        this.connectors.clear();
    }

    getHealth(): IDatabaseHealth {
        const health: IDatabaseHealth = {};

        for (const [name, connector] of this.connectors) {
            health[name] = {
                connected: connector.isConnected(),
                type: connector.getDatabaseType(),
                lastPing: new Date(),
            };
        }

        return health;
    }
}

export const Database = new DatabaseManager();
