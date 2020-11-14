import {
    Router,
} from 'express';
import GlobalDailyStateService from '../services/globalDailyState';
import GlobalStatusService from '../services/globalStatus';

const route = Router();


export default (app: Router): void => {
    app.use('/global-status', route);

    route.get('/',
        async (req, res) => {
            res.send({
                global: await GlobalStatusService.get(),
                outflow: await GlobalStatusService.outflow(),
                inflow: await GlobalStatusService.inflow(),
                monthly: await GlobalDailyStateService.getLast30Days(),
            });
        });
};