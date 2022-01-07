import {
    UbiCommunityDemographics,
    UbiCommunityDemographicsCreation,
} from '../../../interfaces/ubi/ubiCommunityDemographics';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiCommunityDemographicsModel extends Model<
    UbiCommunityDemographics,
    UbiCommunityDemographicsCreation
> {
    public id!: number;
    public communityId!: number;
    public date!: Date; // date isn't unique
    public male!: number;
    public female!: number;
    public undisclosed!: number;
    public totalGender!: number;
    public ageRange1!: number;
    public ageRange2!: number;
    public ageRange3!: number;
    public ageRange4!: number;
    public ageRange5!: number;
    public ageRange6!: number;
}

export function initializeUbiCommunityDemographics(sequelize: Sequelize): void {
    UbiCommunityDemographicsModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            communityId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                unique: true,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
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
            undisclosed: {
                type: DataTypes.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            totalGender: {
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
        },
        {
            tableName: 'ubi_community_demographics',
            timestamps: false,
            sequelize,
        }
    );
}
