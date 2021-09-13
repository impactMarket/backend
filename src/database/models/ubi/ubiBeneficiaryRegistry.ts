import {
    UbiBeneficiaryRegistry,
    UbiBeneficiaryRegistryCreation,
    UbiBeneficiaryRegistryType,
} from '@interfaces/ubi/ubiBeneficiaryRegistry';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiBeneficiaryRegistryModel extends Model<
    UbiBeneficiaryRegistry,
    UbiBeneficiaryRegistryCreation
> {
    public id!: number;
    public address!: string;
    public from!: string;
    public communityId!: number;
    public activity!: UbiBeneficiaryRegistryType;
    public tx!: string;
    public txAt!: Date;
}

export function initializeUbiBeneficiaryRegistry(sequelize: Sequelize): void {
    UbiBeneficiaryRegistryModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                // this is associated with "user"
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            from: {
                // this is associated with "user"
                type: DataTypes.STRING(44),
                allowNull: false,
            },
            communityId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'community',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                allowNull: false,
            },
            activity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            tx: {
                type: DataTypes.STRING(68),
                unique: true,
                allowNull: false,
            },
            txAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'ubi_beneficiary_registry',
            timestamps: false,
            sequelize,
        }
    );
}
