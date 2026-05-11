import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import UsersModel from '@database/models/main/users.model.js';
import { Sequelize } from 'sequelize';

export interface UsersAttributes {
	id?: number;
	person: number;
	user_type: number;
	role?: number;
	email: string;
	password: string;
	signup_code?: string;
	signup_verified_at?: Date;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

interface UsersWithPeople extends UsersAttributes {
	_People: {
		first_name: string;
		last_name: string;
		personal_email: string;
		phone_number: string;
	};
}

class UsersRepository extends SequelizeRepositoryBase<UsersAttributes, number> {
	constructor() {
		super(UsersModel);
	}

	private get _relations() {
		return [
			{
				association: '_People',
				attributes: ['first_name', 'last_name', 'personal_email', 'phone_number'],
				required: true,
			},
			{
				association: '_Roles',
				attributes: ['code'],
				required: false,
				nested: [{ association: '_RoleInheritancesChild' }],
			},
			{
				association: '_UserType',
				attributes: ['description'],
				required: true,
			},
			{
				association: '_UserPermissions',
				attributes: ['permission', 'is_granted'],
				required: false,
			},
		];
	}

	async getFull(id: number) {
		return this.getOne(
			{ id },
			{
				attributes: [
					'id',
					'person',
					'user_type',
					'role',
					'email',
					'last_login',
					'signup_verified_at',
					'created_at',
					'updated_at',
				],
				relations: this._relations,
			},
		) as Promise<UsersWithPeople | null>;
	}

	async getByEmail(email: string) {
		return this.getOne({ email }, { relations: this._relations }) as Promise<UsersWithPeople | null>;
	}

	async getByDocumentNumber(documentNumber: string) {
		return this.getOne(
			{},
			{
				relations: this._relations.map((r) =>
					r.association === '_People' ? { ...r, where: { document_number: documentNumber } } : r,
				),
			},
		) as Promise<UsersWithPeople | null>;
	}

	async getAllFull(filters?: any): Promise<{ rows: UsersWithPeople[]; count: number }> {
		return this.getAll({
			...filters,
			count: true,
			attributes: [
				'id',
				'person',
				'user_type',
				'role',
				'email',
				'last_login',
				'signup_verified_at',
				'created_at',
				'updated_at',
			],
			relations: this._relations,
		}) as Promise<{
			rows: UsersWithPeople[];
			count: number;
		}>;
	}
}

export default new UsersRepository();
