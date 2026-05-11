import { type IDatabaseConfig, type IDatabaseType } from '@rules/database.type.js';
import { ANSI } from '@utils/ansi.util.js';
import { Logger } from '@utils/logger.util.js';
export interface IDatabaseConnector {
	connect(): Promise<boolean>;
	disconnect(): Promise<void>;
	ping(): Promise<boolean>;
	authenticate(): Promise<boolean>;

	getModel<T = any>(modelName: string): T;
	hasModel(modelName: string): boolean;
	listModels(): string[];
	registerModel(name: string, instance: any): boolean;
	processModels(): Promise<void>;
	clearModels(): boolean;

	beforeConnect(): Promise<void> | void;
	afterConnect(): Promise<void> | void;
	beforeDisconnect(): Promise<void> | void;
	afterDisconnect(): Promise<void> | void;
}

export abstract class BaseDatabaseConnector implements IDatabaseConnector {
	protected readonly config: IDatabaseConfig;
	protected readonly models: Map<string, any> = new Map();
	protected connectionStatus: boolean = false;
	protected connector: any;
	protected name: string;

	constructor(config: IDatabaseConfig) {
		this.config = config;
		this.name = config.id;
	}

	abstract connect(): Promise<boolean>;
	abstract disconnect(): Promise<void>;
	abstract ping(): Promise<boolean>;

	isConnected(): boolean {
		return this.connectionStatus;
	}

	protected setStatus(status: boolean) {
		this.connectionStatus = status;
	}

	async authenticate(): Promise<boolean> {
		try {
			await this.ping();

			Logger.natural(ANSI.success(`[+] Database '${this.config.id}' as '${this.config.type}' type connected`));

			return true;
		} catch {}

		return false;
	}

	getModel<T = any>(modelName: string): T {
		if (!this.models.has(modelName))
			throw new Error(`Model '${modelName}' not registered in DB '${this.config.id}'`);

		return this.models.get(modelName) as T;
	}

	getModels<T = any>(): Map<string, T> {
		return this.models;
	}

	hasModel(modelName: string): boolean {
		return this.models.has(modelName);
	}

	listModels(): string[] {
		return Array.from(this.models.keys());
	}

	registerModel(instance: any): boolean {
		this.models.set(instance.name, instance);

		return true;
	}

	getDatabaseType(): IDatabaseType {
		return this.config.type;
	}

	getDatabaseName(): string {
		return this.config.id;
	}

	clearModels(): boolean {
		this.models.clear();

		return true;
	}

	async processModels(): Promise<void> {
		try {
			// @ts-ignore
			if (typeof import.meta.env !== 'undefined') {
				// Importar diferidamente en el bundle con Vite (Lazy Eval)
				// @ts-ignore
				const modelModules = import.meta.glob('../../database/models/*/*.{ts,js}', { eager: false });

				for (const pathModel in modelModules) {
					// pathModel example: '../../database/models/main/user.model.ts'
					const splitted = pathModel.split('/');
					const dbInstanceId = splitted[4];
					const modelFileName = splitted[5];

					if (dbInstanceId !== this.config.id) continue;
					if (/^(index)/.test(modelFileName)) continue;

					const loadedModule = (await modelModules[pathModel]()) as any;
					let modelDefinition = loadedModule;
					if (!modelDefinition.default || typeof modelDefinition.default !== 'function')
						throw new Error(`Model ${modelFileName} does not export a valid class`);

					modelDefinition = modelDefinition.default;

					// init recibe el conector crudo
					const modelInstance = await modelDefinition.init(this.connector, this.config.id);

					this.registerModel(modelInstance);
				}
			} else {
				// Fallback dinámico nativo usando FS (Usado exclusivamente para Jest Testing y utilidades script donde Vite no existe)
				const fs = await import('fs');
				const path = await import('path');
				const { fileURLToPath, pathToFileURL } = await import('url');

				const __dirname = path.dirname(fileURLToPath(import.meta.url));
				const modelsPath = path.join(__dirname, '..', '..', 'database', 'models', this.config.id);

				try {
					fs.accessSync(modelsPath);
				} catch {
					return;
				}

				const modelNames = fs
					.readdirSync(modelsPath, { withFileTypes: true })
					.filter(
						(dirent) => dirent.isFile() && !/^(index)/.test(dirent.name) && /\.(js|ts)$/.test(dirent.name),
					)
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

				for (const modelName of modelNames) {
					const modelPath = path.join(modelsPath, modelName);
					const modelUrl = pathToFileURL(modelPath);
					let modelDefinition = await import(modelUrl.toString());

					if (!modelDefinition.default || typeof modelDefinition.default !== 'function')
						throw new Error(`Model ${modelName} does not export a valid class`);

					modelDefinition = modelDefinition.default;
					const modelInstance = await modelDefinition.init(this.connector, this.config.id);

					this.registerModel(modelInstance);
				}
			}
		} catch (error: any) {
			throw error;
		}
	}

	async beforeConnect(): Promise<void> {}

	async afterConnect(): Promise<void> {
		await this.authenticate();
	}

	async beforeDisconnect(): Promise<void> {}

	async afterDisconnect(): Promise<void> {}
}
