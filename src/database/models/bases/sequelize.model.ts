import {
	Model,
	Sequelize,
	type ModelStatic,
	type ModelAttributes,
	type InitOptions,
	HasOne,
	HasMany,
	BelongsTo,
	BelongsToMany,
} from 'sequelize';
import { BaseModel, type Instance } from '@bases/model.base.js';

type EnhanceConfig = Instance & {
	isBasicTable?: boolean;
	appRawName: string;
	catalogFields?: string | Array<string>;
};

export type EnhanceAttributes = ModelAttributes & {
	enhancedData?: {
		visible?: boolean;
		editable?: boolean;
	};
};

export type ModelWithAssociate = ModelStatic<Model> &
	EnhanceConfig & {
		associate?: (models: Map<string, ModelStatic<Model>>) => void;
	};

export type ModelWithAssociations = ModelStatic<Model> & {
	hasOne: (target: ModelStatic<Model>, options?: any) => HasOne;
	hasMany: (target: ModelStatic<Model>, options?: any) => HasMany;
	belongsTo: (target: ModelStatic<Model>, options?: any) => BelongsTo;
	belongsToMany: (target: ModelStatic<Model>, options?: any) => BelongsToMany;
};

export type RelationsReturn = Array<{
	type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
	target: string;
	options?: any;
	inversed?: boolean;
}>;

export abstract class SequelizeModelBase extends BaseModel {
	static instance?: ModelWithAssociate;

	static config(): Partial<InitOptions & EnhanceConfig> {
		return {};
	}

	static relations(): RelationsReturn {
		return [];
	}

	static definition(): EnhanceAttributes {
		return {};
	}

	static override init(dbInstance: Sequelize, dbInstanceName: string): ModelStatic<Model> {
		const { isBasicTable, appRawName, catalogFields, ...config } = this.config();
		this.instance = dbInstance.define(
			this.modelName,
			this.definition() as ModelAttributes,
			config,
		) as ModelWithAssociate;

		if (this.relations().length > 0)
			this.instance.associate = (models: Map<string, ModelStatic<Model>>) => this.associate(models);

		// Asignamos el nombre de la instancia de base de datos
		this.instance.dbInstanceName = dbInstanceName;
		this.instance.isBasicTable = isBasicTable;
		this.instance.appRawName = appRawName as EnhanceConfig['appRawName'];
		this.instance.catalogFields = catalogFields;

		return this.instance;
	}

	static associate(models: Map<string, ModelStatic<Model>>): void {
		const _source = models.get(this.modelName) as ModelWithAssociations;

		if (!_source) throw new Error(`Model ${this.modelName} not found in models registry`);

		this.relations().forEach((relation) => {
			const relationName = `${relation.target}Model`;
			const source = (
				relation?.inversed ? models.get(relationName) : models.get(this.modelName)
			) as ModelWithAssociations;
			const target = (
				relation?.inversed ? models.get(this.modelName) : models.get(relationName)
			) as ModelWithAssociations;

			if (!target) throw new Error(`Target model ${relationName} not found for relation from ${this.modelName}`);

			switch (relation.type) {
				case 'hasOne':
					source.hasOne(target, relation.options);
					break;
				case 'hasMany':
					source.hasMany(target, relation.options);
					break;
				case 'belongsTo':
					source.belongsTo(target, relation.options);
					break;
				case 'belongsToMany':
					source.belongsToMany(target, relation.options);
					break;
				default:
					throw new Error(`Unknown relation type: ${relation.type}`);
			}
		});
	}
}
