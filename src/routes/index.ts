import { Router } from 'express';
import community from './community';
import transactions from './transactions';


export default () => {
    const app = Router();
    community(app);
    transactions(app);

    return app
}