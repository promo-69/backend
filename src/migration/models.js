// statuses.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class StatusesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'statuses',
            appRawName: 'statuses',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [];
    }
}
:------------:
// operation_types.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OperationTypesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            is_increment: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'operation_types',
            appRawName: 'operation_types',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_OperationTypes' },
            },
        ];
    }
}
:------------:
// genders.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class GendersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'genders',
            appRawName: 'genders',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Genders' },
            },
        ];
    }
}
:------------:
// cinemas.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CinemasModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            name: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            address: {
                allowNull: true,
                type: DataTypes.TEXT,
            },
            phone: {
                allowNull: true,
                type: DataTypes.STRING(50),
            },
            opening_time: {
                allowNull: false,
                type: DataTypes.TIME,
            },
            closing_time: {
                allowNull: false,
                type: DataTypes.TIME,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'cinemas',
            appRawName: 'cinemas',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Cinemas' },
            },
        ];
    }
}
:------------:
// people.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PeopleModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            document_number: {
                allowNull: false,
                type: DataTypes.STRING(50),
            },
            first_name: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            last_name: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            gender: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            phone_number: {
                allowNull: true,
                type: DataTypes.STRING(50),
            },
            email: {
                allowNull: true,
                type: DataTypes.STRING(100),
            },
            birth_date: {
                allowNull: true,
                type: DataTypes.DATEONLY,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                allowNull: true,
                type: DataTypes.DATE,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'people',
            appRawName: 'people',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Genders',
                options: { foreignKey: 'gender', targetKey: 'id', as: '_Gender' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Genders',
                options: { foreignKey: 'gender', targetKey: 'id', as: '_People' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_People' },
            },
        ];
    }
}
:------------:
// user_types.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UserTypesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'user_types',
            appRawName: 'user_types',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_UserTypes' },
            },
        ];
    }
}
:------------:
// roles.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RolesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            code: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'roles',
            appRawName: 'roles',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Roles' },
            },
        ];
    }
}
:------------:
// users.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UsersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            person: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            user_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            role: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            username: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            password: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            last_login: {
                allowNull: true,
                type: DataTypes.DATE,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                allowNull: true,
                type: DataTypes.DATE,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'users',
            appRawName: 'users',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_Person' },
            },
            {
                inversed: true,
                type: 'hasOne',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_User' },
            },
            {
                type: 'belongsTo',
                target: 'UserTypes',
                options: { foreignKey: 'user_type', targetKey: 'id', as: '_UserType' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'UserTypes',
                options: { foreignKey: 'user_type', targetKey: 'id', as: '_Users' },
            },
            {
                type: 'belongsTo',
                target: 'Roles',
                options: { foreignKey: 'role', targetKey: 'id', as: '_Role' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Roles',
                options: { foreignKey: 'role', targetKey: 'id', as: '_Users' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Users' },
            },
        ];
    }
}
:------------:
// employees.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class EmployeesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            person: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            hire_date: {
                allowNull: false,
                type: DataTypes.DATEONLY,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'employees',
            appRawName: 'employees',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_Person' },
            },
            {
                inversed: true,
                type: 'hasOne',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_Employee' },
            },
            {
                type: 'belongsTo',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Employees' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Employees' },
            },
        ];
    }
}
:------------:
// customers.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CustomersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            person: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            registration_date: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'customers',
            appRawName: 'customers',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_Person' },
            },
            {
                inversed: true,
                type: 'hasOne',
                target: 'People',
                options: { foreignKey: 'person', targetKey: 'id', as: '_Customer' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Customers' },
            },
        ];
    }
}
:------------:
// actions.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ActionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            code: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'actions',
            appRawName: 'actions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Actions' },
            },
        ];
    }
}
:------------:
// resources.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ResourcesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            code: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'resources',
            appRawName: 'resources',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Resources' },
            },
        ];
    }
}
:------------:
// permission_types.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PermissionTypesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            code: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'permission_types',
            appRawName: 'permission_types',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_PermissionTypes' },
            },
        ];
    }
}
:------------:
// permissions.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PermissionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            action: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            resource: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            permission_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'permissions',
            appRawName: 'permissions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Actions',
                options: { foreignKey: 'action', targetKey: 'id', as: '_Action' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Actions',
                options: { foreignKey: 'action', targetKey: 'id', as: '_Permissions' },
            },
            {
                type: 'belongsTo',
                target: 'Resources',
                options: { foreignKey: 'resource', targetKey: 'id', as: '_Resource' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Resources',
                options: { foreignKey: 'resource', targetKey: 'id', as: '_Permissions' },
            },
            {
                type: 'belongsTo',
                target: 'PermissionTypes',
                options: { foreignKey: 'permission_type', targetKey: 'id', as: '_PermissionType' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'PermissionTypes',
                options: { foreignKey: 'permission_type', targetKey: 'id', as: '_Permissions' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Permissions' },
            },
        ];
    }
}
:------------:
// role_permissions.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RolePermissionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            role: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            permission: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'role_permissions',
            appRawName: 'role_permissions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Roles',
                options: { foreignKey: 'role', targetKey: 'id', as: '_Role' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Roles',
                options: { foreignKey: 'role', targetKey: 'id', as: '_RolePermissions' },
            },
            {
                type: 'belongsTo',
                target: 'Permissions',
                options: { foreignKey: 'permission', targetKey: 'id', as: '_Permission' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Permissions',
                options: { foreignKey: 'permission', targetKey: 'id', as: '_RolePermissions' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_RolePermissions' },
            },
        ];
    }
}
:------------:
// role_inheritances.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoleInheritancesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            parent_role: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            child_role: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'role_inheritances',
            appRawName: 'role_inheritances',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Roles',
                options: { foreignKey: 'parent_role', targetKey: 'id', as: '_ParentRole' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Roles',
                options: { foreignKey: 'parent_role', targetKey: 'id', as: '_ChildInheritances' },
            },
            {
                type: 'belongsTo',
                target: 'Roles',
                options: { foreignKey: 'child_role', targetKey: 'id', as: '_ChildRole' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Roles',
                options: { foreignKey: 'child_role', targetKey: 'id', as: '_ParentInheritances' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_RoleInheritances' },
            },
        ];
    }
}
:------------:
// user_permissions.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class UserPermissionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            user: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            permission: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            is_granted: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'user_permissions',
            appRawName: 'user_permissions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_User' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_UserPermissions' },
            },
            {
                type: 'belongsTo',
                target: 'Permissions',
                options: { foreignKey: 'permission', targetKey: 'id', as: '_Permission' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Permissions',
                options: { foreignKey: 'permission', targetKey: 'id', as: '_UserPermissions' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_UserPermissions' },
            },
        ];
    }
}
:------------:
// projection_types.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ProjectionTypesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'projection_types',
            appRawName: 'projection_types',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_ProjectionTypes' },
            },
        ];
    }
}
:------------:
// rooms.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoomsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            name: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            grid_rows: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            grid_columns: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            total_capacity: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'rooms',
            appRawName: 'rooms',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Rooms' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Rooms' },
            },
        ];
    }
}
:------------:
// room_projection_types.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class RoomProjectionTypesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            room: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            projection_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'room_projection_types',
            appRawName: 'room_projection_types',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Room' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_RoomProjectionTypes' },
            },
            {
                type: 'belongsTo',
                target: 'ProjectionTypes',
                options: { foreignKey: 'projection_type', targetKey: 'id', as: '_ProjectionType' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'ProjectionTypes',
                options: { foreignKey: 'projection_type', targetKey: 'id', as: '_RoomProjectionTypes' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_RoomProjectionTypes' },
            },
        ];
    }
}
:------------:
// seat_categories.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class SeatCategoriesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'seat_categories',
            appRawName: 'seat_categories',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_SeatCategories' },
            },
        ];
    }
}
:------------:
// seat_conditions.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class SeatConditionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'seat_conditions',
            appRawName: 'seat_conditions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_SeatConditions' },
            },
        ];
    }
}
:------------:
// seats.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class SeatsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            room: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            row_identifier: {
                allowNull: false,
                type: DataTypes.STRING(2),
            },
            column_number: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            seat_category: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            seat_condition: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'seats',
            appRawName: 'seats',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Room' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Seats' },
            },
            {
                type: 'belongsTo',
                target: 'SeatCategories',
                options: { foreignKey: 'seat_category', targetKey: 'id', as: '_SeatCategory' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'SeatCategories',
                options: { foreignKey: 'seat_category', targetKey: 'id', as: '_Seats' },
            },
            {
                type: 'belongsTo',
                target: 'SeatConditions',
                options: { foreignKey: 'seat_condition', targetKey: 'id', as: '_SeatCondition' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'SeatConditions',
                options: { foreignKey: 'seat_condition', targetKey: 'id', as: '_Seats' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Seats' },
            },
        ];
    }
}
:------------:
// currencies.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CurrenciesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            code: {
                allowNull: false,
                type: DataTypes.STRING(10),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            symbol: {
                allowNull: false,
                type: DataTypes.STRING(10),
            },
            is_base_currency: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'currencies',
            appRawName: 'currencies',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Currencies' },
            },
        ];
    }
}
:------------:
// exchange_rates.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ExchangeRatesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            rate: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            user: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'exchange_rates',
            appRawName: 'exchange_rates',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currency' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_ExchangeRates' },
            },
            {
                type: 'belongsTo',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_User' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_ExchangeRates' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_ExchangeRates' },
            },
        ];
    }
}
:------------:
// genres.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class GenresModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'genres',
            appRawName: 'genres',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Genres' },
            },
        ];
    }
}
:------------:
// age_classifications.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class AgeClassificationsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'age_classifications',
            appRawName: 'age_classifications',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_AgeClassifications' },
            },
        ];
    }
}
:------------:
// movie_lifecycle_states.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MovieLifecycleStatesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'movie_lifecycle_states',
            appRawName: 'movie_lifecycle_states',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_MovieLifecycleStates' },
            },
        ];
    }
}
:------------:
// movies.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MoviesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            title: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            duration_minutes: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            age_classification: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            lifecycle_state: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            synopsis: {
                allowNull: false,
                type: DataTypes.TEXT,
            },
            trailer_url: {
                allowNull: true,
                type: DataTypes.STRING(255),
            },
            release_date: {
                allowNull: false,
                type: DataTypes.DATEONLY,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'movies',
            appRawName: 'movies',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'AgeClassifications',
                options: { foreignKey: 'age_classification', targetKey: 'id', as: '_AgeClassification' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'AgeClassifications',
                options: { foreignKey: 'age_classification', targetKey: 'id', as: '_Movies' },
            },
            {
                type: 'belongsTo',
                target: 'MovieLifecycleStates',
                options: { foreignKey: 'lifecycle_state', targetKey: 'id', as: '_LifecycleState' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'MovieLifecycleStates',
                options: { foreignKey: 'lifecycle_state', targetKey: 'id', as: '_Movies' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Movies' },
            },
        ];
    }
}
:------------:
// movie_genres.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MovieGenresModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            movie: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            genre: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'movie_genres',
            appRawName: 'movie_genres',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_Movie' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_MovieGenres' },
            },
            {
                type: 'belongsTo',
                target: 'Genres',
                options: { foreignKey: 'genre', targetKey: 'id', as: '_Genre' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Genres',
                options: { foreignKey: 'genre', targetKey: 'id', as: '_MovieGenres' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_MovieGenres' },
            },
        ];
    }
}
:------------:
// movie_subscriptions.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class MovieSubscriptionsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            customer: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            movie: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            is_notified: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'movie_subscriptions',
            appRawName: 'movie_subscriptions',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Customers',
                options: { foreignKey: 'customer', targetKey: 'id', as: '_Customer' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Customers',
                options: { foreignKey: 'customer', targetKey: 'id', as: '_MovieSubscriptions' },
            },
            {
                type: 'belongsTo',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_Movie' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_MovieSubscriptions' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_MovieSubscriptions' },
            },
        ];
    }
}
:------------:
// showtimes.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ShowtimesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            movie: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            room: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            projection_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            start_time: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            end_time: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            earned_loyalty_points: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'showtimes',
            appRawName: 'showtimes',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_Movie' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Movies',
                options: { foreignKey: 'movie', targetKey: 'id', as: '_Showtimes' },
            },
            {
                type: 'belongsTo',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Room' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Rooms',
                options: { foreignKey: 'room', targetKey: 'id', as: '_Showtimes' },
            },
            {
                type: 'belongsTo',
                target: 'ProjectionTypes',
                options: { foreignKey: 'projection_type', targetKey: 'id', as: '_ProjectionType' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'ProjectionTypes',
                options: { foreignKey: 'projection_type', targetKey: 'id', as: '_Showtimes' },
            },
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currency' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Showtimes' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Showtimes' },
            },
        ];
    }
}
:------------:
// audience_categories.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class AudienceCategoriesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'audience_categories',
            appRawName: 'audience_categories',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_AudienceCategories' },
            },
        ];
    }
}
:------------:
// week_days.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class WeekDaysModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(50),
            },
            day_number: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'week_days',
            appRawName: 'week_days',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_WeekDays' },
            },
        ];
    }
}
:------------:
// modifier_scopes.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ModifierScopesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'modifier_scopes',
            appRawName: 'modifier_scopes',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_ModifierScopes' },
            },
        ];
    }
}
:------------:
// price_modifiers.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PriceModifiersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            modifier_scope: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            audience_category: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            week_day: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            seat_category: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            projection_type: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            product_category: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            product: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            combo: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            operation_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            is_percentage: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
            },
            value: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'price_modifiers',
            appRawName: 'price_modifiers',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'ModifierScopes', options: { foreignKey: 'modifier_scope', targetKey: 'id', as: '_ModifierScope' } },
            { inversed: true, type: 'hasMany', target: 'ModifierScopes', options: { foreignKey: 'modifier_scope', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'AudienceCategories', options: { foreignKey: 'audience_category', targetKey: 'id', as: '_AudienceCategory' } },
            { inversed: true, type: 'hasMany', target: 'AudienceCategories', options: { foreignKey: 'audience_category', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'WeekDays', options: { foreignKey: 'week_day', targetKey: 'id', as: '_WeekDay' } },
            { inversed: true, type: 'hasMany', target: 'WeekDays', options: { foreignKey: 'week_day', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'SeatCategories', options: { foreignKey: 'seat_category', targetKey: 'id', as: '_SeatCategory' } },
            { inversed: true, type: 'hasMany', target: 'SeatCategories', options: { foreignKey: 'seat_category', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'ProjectionTypes', options: { foreignKey: 'projection_type', targetKey: 'id', as: '_ProjectionType' } },
            { inversed: true, type: 'hasMany', target: 'ProjectionTypes', options: { foreignKey: 'projection_type', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'ProductCategories', options: { foreignKey: 'product_category', targetKey: 'id', as: '_ProductCategory' } },
            { inversed: true, type: 'hasMany', target: 'ProductCategories', options: { foreignKey: 'product_category', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'Products', options: { foreignKey: 'product', targetKey: 'id', as: '_Product' } },
            { inversed: true, type: 'hasMany', target: 'Products', options: { foreignKey: 'product', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'Combos', options: { foreignKey: 'combo', targetKey: 'id', as: '_Combo' } },
            { inversed: true, type: 'hasMany', target: 'Combos', options: { foreignKey: 'combo', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'OperationTypes', options: { foreignKey: 'operation_type', targetKey: 'id', as: '_OperationType' } },
            { inversed: true, type: 'hasMany', target: 'OperationTypes', options: { foreignKey: 'operation_type', targetKey: 'id', as: '_PriceModifiers' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_PriceModifiers' } },
        ];
    }
}
:------------:
// product_categories.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ProductCategoriesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'product_categories',
            appRawName: 'product_categories',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_ProductCategories' },
            },
        ];
    }
}
:------------:
// products.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ProductsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            name: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            sku: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            product_category: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            earned_loyalty_points: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'products',
            appRawName: 'products',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'ProductCategories',
                options: { foreignKey: 'product_category', targetKey: 'id', as: '_ProductCategory' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'ProductCategories',
                options: { foreignKey: 'product_category', targetKey: 'id', as: '_Products' },
            },
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currency' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Products' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Products' },
            },
        ];
    }
}
:------------:
// combos.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class CombosModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            name: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            sku: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            earned_loyalty_points: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'combos',
            appRawName: 'combos',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Currency' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Currencies',
                options: { foreignKey: 'currency', targetKey: 'id', as: '_Combos' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Combos' },
            },
        ];
    }
}
:------------:
// combo_products.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class ComboProductsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            combo: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            product: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            quantity: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'combo_products',
            appRawName: 'combo_products',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Combos',
                options: { foreignKey: 'combo', targetKey: 'id', as: '_Combo' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Combos',
                options: { foreignKey: 'combo', targetKey: 'id', as: '_ComboProducts' },
            },
            {
                type: 'belongsTo',
                target: 'Products',
                options: { foreignKey: 'product', targetKey: 'id', as: '_Product' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Products',
                options: { foreignKey: 'product', targetKey: 'id', as: '_ComboProducts' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_ComboProducts' },
            },
        ];
    }
}
:------------:
// inventories.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class InventoriesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            product: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            stock: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'inventories',
            appRawName: 'inventories',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Cinemas',
                options: { foreignKey: 'cinema', targetKey: 'id', as: '_Inventories' },
            },
            {
                type: 'belongsTo',
                target: 'Products',
                options: { foreignKey: 'product', targetKey: 'id', as: '_Product' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Products',
                options: { foreignKey: 'product', targetKey: 'id', as: '_Inventories' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Inventories' },
            },
        ];
    }
}
:------------:
// inventory_movements.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class InventoryMovementsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            inventory: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            operation_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            quantity: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            user: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            remarks: {
                allowNull: true,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'inventory_movements',
            appRawName: 'inventory_movements',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Inventories',
                options: { foreignKey: 'inventory', targetKey: 'id', as: '_Inventory' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Inventories',
                options: { foreignKey: 'inventory', targetKey: 'id', as: '_InventoryMovements' },
            },
            {
                type: 'belongsTo',
                target: 'OperationTypes',
                options: { foreignKey: 'operation_type', targetKey: 'id', as: '_OperationType' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'OperationTypes',
                options: { foreignKey: 'operation_type', targetKey: 'id', as: '_InventoryMovements' },
            },
            {
                type: 'belongsTo',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_User' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Users',
                options: { foreignKey: 'user', targetKey: 'id', as: '_InventoryMovements' },
            },
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_InventoryMovements' },
            },
        ];
    }
}
:------------:
// order_statuses.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrderStatusesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'order_statuses',
            appRawName: 'order_statuses',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_OrderStatuses' },
            },
        ];
    }
}
:------------:
// payment_methods.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class PaymentMethodsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            requires_reference: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'payment_methods',
            appRawName: 'payment_methods',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_PaymentMethods' },
            },
        ];
    }
}
:------------:
// line_types.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class LineTypesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            description: {
                allowNull: false,
                type: DataTypes.STRING(255),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'line_types',
            appRawName: 'line_types',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_Status' },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Statuses',
                options: { foreignKey: 'status', targetKey: 'id', as: '_LineTypes' },
            },
        ];
    }
}
:------------:
// orders.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrdersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            customer: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            employee: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            cinema: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            order_status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            base_currency: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            total_amount_base_currency: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            generated_points: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'orders',
            appRawName: 'orders',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Customers', options: { foreignKey: 'customer', targetKey: 'id', as: '_Customer' } },
            { inversed: true, type: 'hasMany', target: 'Customers', options: { foreignKey: 'customer', targetKey: 'id', as: '_Orders' } },
            { type: 'belongsTo', target: 'Employees', options: { foreignKey: 'employee', targetKey: 'id', as: '_Employee' } },
            { inversed: true, type: 'hasMany', target: 'Employees', options: { foreignKey: 'employee', targetKey: 'id', as: '_Orders' } },
            { type: 'belongsTo', target: 'Cinemas', options: { foreignKey: 'cinema', targetKey: 'id', as: '_Cinema' } },
            { inversed: true, type: 'hasMany', target: 'Cinemas', options: { foreignKey: 'cinema', targetKey: 'id', as: '_Orders' } },
            { type: 'belongsTo', target: 'OrderStatuses', options: { foreignKey: 'order_status', targetKey: 'id', as: '_OrderStatus' } },
            { inversed: true, type: 'hasMany', target: 'OrderStatuses', options: { foreignKey: 'order_status', targetKey: 'id', as: '_Orders' } },
            { type: 'belongsTo', target: 'Currencies', options: { foreignKey: 'base_currency', targetKey: 'id', as: '_BaseCurrency' } },
            { inversed: true, type: 'hasMany', target: 'Currencies', options: { foreignKey: 'base_currency', targetKey: 'id', as: '_Orders' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Orders' } },
        ];
    }
}
:------------:
// order_lines.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrderLinesModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            order: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            line_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            product: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            combo: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            quantity: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            original_unit_price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            price_modifier: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            unit_price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            applied_exchange_rate: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'order_lines',
            appRawName: 'order_lines',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Order' } },
            { inversed: true, type: 'hasMany', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'LineTypes', options: { foreignKey: 'line_type', targetKey: 'id', as: '_LineType' } },
            { inversed: true, type: 'hasMany', target: 'LineTypes', options: { foreignKey: 'line_type', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'Products', options: { foreignKey: 'product', targetKey: 'id', as: '_Product' } },
            { inversed: true, type: 'hasMany', target: 'Products', options: { foreignKey: 'product', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'Combos', options: { foreignKey: 'combo', targetKey: 'id', as: '_Combo' } },
            { inversed: true, type: 'hasMany', target: 'Combos', options: { foreignKey: 'combo', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'PriceModifiers', options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_PriceModifier' } },
            { inversed: true, type: 'hasMany', target: 'PriceModifiers', options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_AppliedExchangeRate' } },
            { inversed: true, type: 'hasMany', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_OrderLines' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_OrderLines' } },
        ];
    }
}
:------------:
// tickets.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class TicketsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            order: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            showtime: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            seat: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            original_price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            price_modifier: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            price: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            applied_exchange_rate: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            qr_code: {
                allowNull: false,
                type: DataTypes.STRING(500),
            },
            validation_time: {
                allowNull: true,
                type: DataTypes.DATE,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'tickets',
            appRawName: 'tickets',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Order' } },
            { inversed: true, type: 'hasMany', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Tickets' } },
            { type: 'belongsTo', target: 'Showtimes', options: { foreignKey: 'showtime', targetKey: 'id', as: '_Showtime' } },
            { inversed: true, type: 'hasMany', target: 'Showtimes', options: { foreignKey: 'showtime', targetKey: 'id', as: '_Tickets' } },
            { type: 'belongsTo', target: 'Seats', options: { foreignKey: 'seat', targetKey: 'id', as: '_Seat' } },
            { inversed: true, type: 'hasOne', target: 'Seats', options: { foreignKey: 'seat', targetKey: 'id', as: '_Ticket' } },
            { type: 'belongsTo', target: 'PriceModifiers', options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_PriceModifier' } },
            { inversed: true, type: 'hasMany', target: 'PriceModifiers', options: { foreignKey: 'price_modifier', targetKey: 'id', as: '_Tickets' } },
            { type: 'belongsTo', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_AppliedExchangeRate' } },
            { inversed: true, type: 'hasMany', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_Tickets' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Tickets' } },
        ];
    }
}
:------------:
// order_payments.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class OrderPaymentsModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            order: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            payment_method: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            amount: {
                allowNull: false,
                type: DataTypes.DECIMAL(10, 2),
            },
            applied_exchange_rate: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            reference_number: {
                allowNull: true,
                type: DataTypes.STRING(255),
            },
            is_approved: {
                allowNull: false,
                type: DataTypes.BOOLEAN,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'order_payments',
            appRawName: 'order_payments',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Order' } },
            { inversed: true, type: 'hasMany', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_OrderPayments' } },
            { type: 'belongsTo', target: 'PaymentMethods', options: { foreignKey: 'payment_method', targetKey: 'id', as: '_PaymentMethod' } },
            { inversed: true, type: 'hasMany', target: 'PaymentMethods', options: { foreignKey: 'payment_method', targetKey: 'id', as: '_OrderPayments' } },
            { type: 'belongsTo', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_AppliedExchangeRate' } },
            { inversed: true, type: 'hasMany', target: 'ExchangeRates', options: { foreignKey: 'applied_exchange_rate', targetKey: 'id', as: '_OrderPayments' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_OrderPayments' } },
        ];
    }
}
:------------:
// loyalty_ledgers.model.ts
import { DataTypes } from 'sequelize';
import { type RelationsReturn, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';

export default class LoyaltyLedgersModel extends SequelizeModelBase {
    static definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            customer: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            order: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            operation_type: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            points: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        };
    }

    static config() {
        return {
            isBasicTable: false,
            schema: 'public',
            tableName: 'loyalty_ledgers',
            appRawName: 'loyalty_ledgers',
            timestamps: false,
        };
    }

    static override relations(): RelationsReturn {
        return [
            { type: 'belongsTo', target: 'Customers', options: { foreignKey: 'customer', targetKey: 'id', as: '_Customer' } },
            { inversed: true, type: 'hasMany', target: 'Customers', options: { foreignKey: 'customer', targetKey: 'id', as: '_LoyaltyLedgers' } },
            { type: 'belongsTo', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_Order' } },
            { inversed: true, type: 'hasMany', target: 'Orders', options: { foreignKey: 'order', targetKey: 'id', as: '_LoyaltyLedgers' } },
            { type: 'belongsTo', target: 'OperationTypes', options: { foreignKey: 'operation_type', targetKey: 'id', as: '_OperationType' } },
            { inversed: true, type: 'hasMany', target: 'OperationTypes', options: { foreignKey: 'operation_type', targetKey: 'id', as: '_LoyaltyLedgers' } },
            { type: 'belongsTo', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_Status' } },
            { inversed: true, type: 'hasMany', target: 'Statuses', options: { foreignKey: 'status', targetKey: 'id', as: '_LoyaltyLedgers' } },
        ];
    }
}