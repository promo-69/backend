import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';
import UsersModel from '@database/models/main/users.model.js';
import { USER_TYPE } from '@constants/magic-numbers.constant.js';

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
	_UserPermissions?: { permission: number; is_granted: boolean }[];
	_Roles?: {
		code: string;
		_RoleInheritancesChild?: { parent_role: number }[];
	};
}

class UsersRepository extends SequelizeRepositoryBase<UsersAttributes, number> {
	constructor() {
		super(UsersModel);
	}

	public get _relations() {
		return [
			{
				association: '_People',
				attributes: [
					'document_number',
					'first_name',
					'last_name',
					'personal_email',
					'phone_number',
					'birth_date',
					'gender',
				],
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
					{
						association: '_Genders',
						attributes: ['id', 'description'],
					},
				],
			},
			{
				association: '_Roles',
				attributes: ['code', 'name'],
				required: false,
				nested: [{ association: '_RoleInheritancesChild' }],
			},
			{
				association: '_UserTypes',
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
				attributes: ['id', 'person', 'user_type', 'role', 'email', 'signup_verified_at', 'created_at'],
				relations: this._relations,
			},
		) as Promise<UsersWithPeople | null>;
	}

	async getAllFull(filters?: any): Promise<{ rows: UsersWithPeople[]; count: number }> {
		return this.getAll({
			...filters,
			count: true,
			attributes: ['id', 'person', 'user_type', 'role', 'email', 'signup_verified_at', 'created_at'],
			relations: this._relations,
		}) as Promise<{
			rows: UsersWithPeople[];
			count: number;
		}>;
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
			{ email, user_type: USER_TYPE.CUSTOMER },
			{
				attributes: ['id', 'person', 'user_type', 'role', 'email', 'signup_verified_at', 'signup_code'],
				relations: this._relations,
			},
		) as Promise<UsersWithPeople | null>;
	}

	async getByEmployeeEmail(email: string) {
		return this.getOne(
			{ email, user_type: USER_TYPE.EMPLOYEE },
			{
				attributes: ['id', 'person', 'user_type', 'role', 'email', 'signup_verified_at', 'signup_code'],
				relations: this._relations,
			},
		) as Promise<UsersWithPeople | null>;
	}
}

export default new UsersRepository();
