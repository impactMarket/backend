import { DataTypes, Model, Sequelize } from 'sequelize';

import { UbiBeneficiarySurvey, UbiBeneficiarySurveyCreation } from '../../../interfaces/ubi/ubiBeneficiarySurvey';

export class UbiBeneficiarySurveyModel extends Model<UbiBeneficiarySurvey, UbiBeneficiarySurveyCreation> {
    public id!: number;
    public userId!: number;
    public surveyId!: number;
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
                primaryKey: true
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            surveyId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            question: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            answer: {
                type: DataTypes.STRING(128),
                allowNull: true
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: new Date()
            }
        },
        {
            tableName: 'ubi_beneficiary_survey',
            modelName: 'ubiBeneficiarySurvey',
            sequelize,
            updatedAt: false
        }
    );
}
