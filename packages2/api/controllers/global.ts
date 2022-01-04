import GlobalDailyStateService from '@services/global/globalDailyState';
import GlobalDemographicsService from '@services/global/globalDemographics';
import GlobalGrowthService from '@services/global/globalGrowth';
import ReachedAddressService from '@services/reachedAddress';
import InflowService from '@services/ubi/inflow';
import { standardResponse } from '@utils/api';
import { Request, Response } from 'express';

const reachedAddressService = new ReachedAddressService();
const globalGrowth = new GlobalGrowthService();
const globalDailyStateService = new GlobalDailyStateService();

const globalStatus = (req: Request, res: Response) => {
    const waitForResult = new Promise(async (resolve, reject) => {
        try {
            resolve({
                monthly: await globalDailyStateService.getLast30Days(),
                lastQuarterAvgSSI:
                    await globalDailyStateService.last90DaysAvgSSI(),
                today: await globalDailyStateService.notYetCountedToday(),
                totalBackers: await InflowService.countEvergreenBackers(),
                reachedLastMonth:
                    await reachedAddressService.getAllReachedLast30Days(),
                growth: await globalGrowth.getLast(),
            });
        } catch (e) {
            reject(e);
        }
    });
    waitForResult
        .then((r) => res.send(r))
        .catch((e) => standardResponse(res, 400, false, '', { error: e }));
};
const globalDemographics = (req: Request, res: Response) => {
    GlobalDemographicsService.getLast()
        .then((r) => res.send(r))
        .catch((e) => standardResponse(res, 400, false, '', { error: e }));
};
const numbers = (req: Request, res: Response) => {
    globalDailyStateService
        .numbers()
        .then((r) => standardResponse(res, 200, true, r))
        .catch((e) => standardResponse(res, 400, false, '', { error: e }));
};

export default { globalStatus, globalDemographics, numbers };
