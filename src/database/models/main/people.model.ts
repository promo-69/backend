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
                type: DataTypes.STRING(16),
            },
            first_name: {
                allowNull: false,
                type: DataTypes.STRING(50),
            },
            last_name: {
                allowNull: false,
                type: DataTypes.STRING(50),
            },
            gender: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            phone_number: {
                allowNull: true,
                type: DataTypes.STRING(30),
            },
            email: {
                allowNull: true,
                type: DataTypes.STRING(50),
            },
            birth_date: {
                allowNull: true,
                type: DataTypes.DATEONLY,
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: '1',
            },
        };
    }

    static config() {
        return {
            isBasicTable: true,
            schema: 'public',
            tableName: 'people',
            appRawName: 'people',
        };
    }

    static override relations(): RelationsReturn {
        return [
            {
                type: 'belongsTo',
                target: 'Genders',
                options: {
                    foreignKey: 'gender',
                    targetKey: 'id',
                    as: '_Gender',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Genders',
                options: {
                    foreignKey: 'gender',
                    targetKey: 'id',
                    as: '_People',
                },
            },
            {
                type: 'belongsTo',
                target: 'Status',
                options: {
                    foreignKey: 'status',
                    targetKey: 'id',
                    as: '_Status',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'Status',
                options: {
                    foreignKey: 'status',
                    targetKey: 'id',
                    as: '_People',
                },
            },
        ];
    }
}
