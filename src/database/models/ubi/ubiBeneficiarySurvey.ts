import { UbiBeneficiarySurvey, UbiBeneficiarySurveyCreation } from '@interfaces/ubi/ubiBeneficiarySurvey';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class UbiBeneficiarySurveyModel extends Model<UbiBeneficiarySurvey, UbiBeneficiarySurveyCreation> {
    public id!: number;
    public user!: number;
    public question!: number;
    public answer!: string;

    // timestamps!
    public readonly createdAt!: Date;
}

export function initializeUbiBeneficiarySurvey(sequelize: Sequelize): void {
    UbiBeneficiarySurveyModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            question: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            answer: {
                type: DataTypes.STRING(128),
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: new Date(),
            },
        },
        {
            tableName: 'ubi_beneficiary_survey',
            sequelize,
            updatedAt: false,
        }
    );
}
