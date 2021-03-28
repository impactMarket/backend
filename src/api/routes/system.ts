import CommunityDailyStateService from '@services/communityDailyState';
import GlobalDailyStateService from '@services/global/globalDailyState';
import InflowService from '@services/ubi/inflow';
import ReachedAddressService from '@services/reachedAddress';
import systemValidators from '@validators/system';
import { Router } from 'express';

import { models } from '../../database';

export default (app: Router): void => {
    const subscribersModel = models.subscribers;
    const reachedAddressService = new ReachedAddressService();
    const globalDailyStateService = new GlobalDailyStateService();
    app.get('/clock', (req, res) => res.json(new Date().getTime()));

    app.post('/subscribe', systemValidators.subscribe, (req, res) => {
        const { email } = req.body;
        subscribersModel
            .create({
                email,
            })
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(400));
    });

    /**
     * for backwards compatibility, remove ASAP
     */
    app.get('/global-status', async (req, res) => {
        res.send({
            monthly: await globalDailyStateService.getLast30Days(),
            lastQuarterAvgSSI: await globalDailyStateService.last90DaysAvgSSI(),
            today: await CommunityDailyStateService.notYetCountedToday(),
            totalBackers: await InflowService.countEvergreenBackers(),
            reachedLastMonth: await reachedAddressService.getAllReachedLast30Days(),
        });
    });
};
