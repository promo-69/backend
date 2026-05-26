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

export interface UsersWithPeople extends UsersAttributes {
	_People: {
		first_name: string;
		last_name: string;
		personal_email: string;
		phone_number: string;
	};
}

const USER_TYPE_EMPLOYEE = 1;
const USER_TYPE_CUSTOMER = 2;

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
				nested: [
					{
						association: '_Employees',
						attributes: ['id'],
						required: false,
						where: { deleted_at: null },
						nested: [
							{
								association: '_EmployeePositions',
								attributes: ['cinema'],
								separate: true,
								order: [['id', 'DESC']],
								limit: 1,
							},
						],
					},
				],
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
					'signup_verified_at',
					'created_at',
					'updated_at',
				],
				relations: this._relations,
			},
		) as Promise<UsersWithPeople | null>;
	}

	async getByEmail(email: string) {
		return this.getOne(
			{ email },
			{
				attributes: ['id', 'person', 'user_type', 'role', 'email', 'signup_verified_at', 'signup_code'],
				relations: this._relations,
			},
		) as Promise<UsersWithPeople | null>;
	}

	async getByClientEmail(email: string) {
		return this.getOne(
			{ email, user_type: USER_TYPE_CUSTOMER },
			{
				attributes: ['id', 'person', 'user_type', 'role', 'email', 'signup_verified_at', 'signup_code'],
				relations: this._relations,
			},
		) as Promise<UsersWithPeople | null>;
	}

	async getByEmployeeEmail(email: string) {
		return this.getOne(
			{ email, user_type: USER_TYPE_EMPLOYEE },
			{
				attributes: ['id', 'person', 'user_type', 'role', 'email', 'signup_verified_at', 'signup_code'],
				relations: this._relations,
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
