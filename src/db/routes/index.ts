import { Router } from 'express';
import community from './community';
import transactions from './transactions';
import user from './user';
import s3 from './s3';


export default (): Router => {
    const app = Router();
    community(app);
    transactions(app);
    user(app);
    s3(app);

    return app;
}