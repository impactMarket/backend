import {
    Router,
} from 'express';
import GlobalStatusService from '../services/globalStatus';

const route = Router();


export default (app: Router): void => {
    app.use('/global-status', route);

    route.get('/',
        async (req, res) => {
            res.send(await GlobalStatusService.get());
        });
};