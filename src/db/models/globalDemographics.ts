import { Sequelize, DataTypes, Model } from 'sequelize';

interface GlobalDemographicsAttributes {
    id: number;
    date: Date;
    country: string;
    male: number;
    female: number;
    ageRange1: number;
    ageRange2: number;
    ageRange3: number;
    ageRange4: number;
    ageRange5: number;
    ageRange6: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
};
export interface GlobalDemographicsCreationAttributes {
    date: Date;
    country: string;
    male: number;
    female: number;
    ageRange1: number;
    ageRange2: number;
    ageRange3: number;
    ageRange4: number;
    ageRange5: number;
    ageRange6: number;
};

export class GlobalDemographics extends Model<GlobalDemographicsAttributes, GlobalDemographicsCreationAttributes> {
    public id!: number;
    public date!: Date;
    public country!: string;
    public male!: number;
    public female!: number;
    public ageRange1!: number;
    public ageRange2!: number;
    public ageRange3!: number;
    public ageRange4!: number;
    public ageRange5!: number;
    public ageRange6!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeGlobalDemographics(sequelize: Sequelize): void {
    GlobalDemographics.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            country: {
                type: DataTypes.STRING(4), // ISO code
                allowNull: false,
            },
            male: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            female: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange1: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange2: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange3: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange4: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange5: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            ageRange6: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'globaldemographics',
            sequelize,
        }
    );
}
