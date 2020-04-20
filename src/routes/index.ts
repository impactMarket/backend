import { Router } from 'express';
import community from './community';


export default () => {
    const app = Router();
    community(app);

    return app
}