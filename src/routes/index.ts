import { Router } from 'express';
import community from './community';
import transactions from './transactions';
import beneficiary from './beneficiary';
import username from './username';


export default () => {
    const app = Router();
    community(app);
    transactions(app);
    beneficiary(app);
    username(app);

    return app;
}