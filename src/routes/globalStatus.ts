import {
    Router,
} from 'express';
import GlobalDailyStateService from '../services/globalDailyState';

const route = Router();


export default (app: Router): void => {
    app.use('/global-status', route);

    route.get('/',
        async (req, res) => {
            res.send({
                monthly: await GlobalDailyStateService.getLast30Days(),
            });
        });
};