import { Router } from 'express';
import community from './community';
import transactions from './transactions';
import user from './user';
import s3 from './s3';
import { Sequelize } from 'sequelize/types';
import claimLocation from './claimLocation';
import exchange from './exchange';


export default (sequelize: Sequelize): Router => {
    const app = Router();
    community(app);
    transactions(app);
    user(app, sequelize);
    s3(app);
    claimLocation(app);
    exchange(app);

    return app;
}