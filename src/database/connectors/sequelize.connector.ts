import { Sequelize } from 'sequelize';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { type IDatabaseConfig } from '@rules/database.type.js';
import { Logger } from '@utils/logger.util.js';

export class SequelizeConnector extends BaseDatabaseConnector {
	declare protected connector: Sequelize;

	constructor(config: IDatabaseConfig) {
		super(config);
	}

	async connect(): Promise<boolean> {
		// Ejecutar instrucciones pre-conexión
		await this.beforeConnect();

		this.connector = new Sequelize(this.config.database!, this.config.username!, this.config.password!, {
			host: this.config.host,
			port: this.config.port,
			dialect: this.config.dialect as any,
			timezone: this.config.timezone,
			logging: this.config.logging ? (message: string) => Logger.logDefinition(message, 'SQL') : console.log,
			pool: this.config.pool,
			define: {
				underscored: true, // Usar snake_case en la BD
				freezeTableName: true,
				timestamps: false,
			},
			...(this.config.ssl
				? {
						dialectOptions: {
							ssl: {
								require: true,
								rejectUnauthorized: false,
							},
						},
					}
				: {}),
		});

		// Ejecutar instrucciones post-conexión
		await this.afterConnect();

		this.setStatus(true);

		return true;
	}

	async afterConnect(): Promise<void> {
		await super.afterConnect();

		await this.processModels();

		this.setupRelations();
	}

	async disconnect(): Promise<void> {
		await this.beforeDisconnect();
		await this.connector.close();
		this.setStatus(false);
		this.clearModels();
		await this.afterDisconnect();
	}

	async ping(): Promise<boolean> {
		try {
			await this.connector.authenticate();

			return true;
		} catch (error) {
			//throw error;
		}

		return false;
	}

	setupRelations(): void {
		Array.from(this.models.values()).forEach((model) => {
			if (model.associate == null || typeof model.associate !== 'function') return;

			model.associate(this.models);
		});
	}
}
