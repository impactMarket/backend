import { Request, Response } from 'express';
import { services } from '@impactmarket/core';

import { standardResponse } from '../../utils/api';

const globalGrowth = new services.global.GlobalGrowthService();
const globalDailyStateService = new services.global.GlobalDailyStateService();
const globalDemographicsService = new services.global.GlobalDemographicsService();

const globalStatus = (req: Request, res: Response) => {
    const waitForResult = new Promise(async (resolve, reject) => {
        try {
            const monthly = await globalDailyStateService.getLast30Days();
            resolve({
                monthly,
                lastQuarterAvgSSI: await globalDailyStateService.last90DaysAvgSSI(),
                today: await globalDailyStateService.notYetCountedToday(),
                totalBackers: monthly[0].totalBackers,
                reachedLastMonth: {
                    reach: monthly[0].monthReach,
                    reachOut: 0
                },
                growth: await globalGrowth.getLast()
            });
        } catch (e) {
            reject(e);
        }
    });
    waitForResult.then(r => res.send(r)).catch(e => standardResponse(res, 400, false, '', { error: e }));
};
const globalDemographics = (req: Request, res: Response) => {
    globalDemographicsService
        .get()
        .then(r => res.send(r))
        .catch(e => standardResponse(res, 400, false, '', { error: e }));
};
const numbers = (req: Request, res: Response) => {
    globalDailyStateService
        .numbers()
        .then(r => standardResponse(res, 200, true, r))
        .catch(e => standardResponse(res, 400, false, '', { error: e }));
};

export default { globalStatus, globalDemographics, numbers };
