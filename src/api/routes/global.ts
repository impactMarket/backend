import CommunityDailyStateService from '@services/communityDailyState';
import GlobalDailyStateService from '@services/globalDailyState';
import GlobalDemographicsService from '@services/globalDemographics';
import InflowService from '@services/inflow';
import ReachedAddressService from '@services/reachedAddress';
import { Router } from 'express';

const route = Router();

export default (app: Router): void => {
    const reachedAddressService = new ReachedAddressService();
    app.use('/global', route);

    route.get('/status', async (req, res) => {
        res.send({
            monthly: await GlobalDailyStateService.getLast30Days(),
            lastQuarterAvgSSI: await GlobalDailyStateService.last90DaysAvgSSI(),
            today: await CommunityDailyStateService.notYetCountedToday(),
            totalBackers: await InflowService.countEvergreenBackers(),
            reachedLastMonth: await reachedAddressService.getAllReachedLast30Days(),
        });
    });

    route.get('/demographics', async (req, res) => {
        res.send(await GlobalDemographicsService.getLast());
    });
};
