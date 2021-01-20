import GlobalDemographicsService from '@services/globalDemographics';
import { Router } from 'express';

import CommunityDailyStateService from '@services/communityDailyState';
import GlobalDailyStateService from '@services/globalDailyState';
import InflowService from '@services/inflow';
import ReachedAddressService from '@services/reachedAddress';

const route = Router();

export default (app: Router): void => {
    app.use('/global', route);

    route.get('/status', async (req, res) => {
        res.send({
            monthly: await GlobalDailyStateService.getLast30Days(),
            lastQuarterAvgSSI: await GlobalDailyStateService.last90DaysAvgSSI(),
            today: await CommunityDailyStateService.notYetCountedToday(),
            totalBackers: await InflowService.countEvergreenBackers(),
            reachedLastMonth: await ReachedAddressService.getAllReachedLast30Days(),
        });
    });

    route.get('/demographics', async (req, res) => {
        res.send(await GlobalDemographicsService.getLast());
    });
};
