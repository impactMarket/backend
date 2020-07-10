import { Router } from 'express';
import community from './community';
import transactions from './transactions';
import user from './user';
import s3 from './s3';
import { Sequelize } from 'sequelize/types';


export default (sequelize: Sequelize): Router => {
    const app = Router();
    community(app);
    transactions(app);
    user(app, sequelize);
    s3(app);

    return app;
}