import { AppSurvey, AppSurveyCreation } from '@interfaces/app/appSurvey';
import { Sequelize, DataTypes, Model } from 'sequelize';

export class AppSurveyModel extends Model<AppSurvey, AppSurveyCreation> {
    public id!: number;
    public user!: number;
    public question!: number;
    public answer!: string;

    // timestamps!
    public readonly createdAt!: Date;
}

export function initializeAppSurvey(sequelize: Sequelize): void {
    AppSurveyModel.init(
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
            tableName: 'app_survey',
            sequelize,
            timestamps: false,
        }
    );
}
