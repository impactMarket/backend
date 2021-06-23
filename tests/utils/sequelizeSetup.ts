import { Options, Sequelize } from 'sequelize';

import config from '../../src/config';
import initModels from '../../src/database/models';

export function sequelizeSetup() {
    const dbConfig: Options = {
        dialect: 'postgres',
        // dialectOptions: {
        //     connectTimeout: 60000,
        // },
        // pool: {
        //     max: 30,
        //     min: 0,
        //     acquire: 60000,
        //     idle: 5000,
        // },
        protocol: 'postgres',
        native: true,
        logging: false,
        // query: { raw: true }, // I wish, eager loading gets fixed
    };
    const sequelize = new Sequelize(config.dbUrl, dbConfig);
    initModels(sequelize);
    return sequelize;
}

const truncateTable = (sequelize: Sequelize, modelName: string) =>
    sequelize.models[modelName].destroy({
        where: {},
        force: true,
    });

export default async function truncate(sequelize: Sequelize, model?: string) {
    if (model) {
        return truncateTable(sequelize, model);
    }

    return Promise.all(
        Object.keys(sequelize.models).map((key) => {
            if (['sequelize', 'Sequelize'].includes(key)) return null;
            return truncateTable(sequelize, key);
        })
    );
}
