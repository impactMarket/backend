import CommunityDailyStateService from '@services/communityDailyState';
import GlobalDailyStateService from '@services/globalDailyState';
import GlobalDemographicsService from '@services/globalDemographics';
import GlobalGrowthService from '@services/globalGrowth';
import InflowService from '@services/inflow';
import ReachedAddressService from '@services/reachedAddress';
import { controllerLogAndFail } from '@utils/api';
import { Request, Response } from 'express';

const reachedAddressService = new ReachedAddressService();
const globalGrowth = new GlobalGrowthService();
const globalDailyStateService = new GlobalDailyStateService();

const globalStatus = (req: Request, res: Response) => {
    const waitForResult = new Promise(async (resolve, reject) => {
        try {
            resolve({
                monthly: await globalDailyStateService.getLast30Days(),
                lastQuarterAvgSSI: await globalDailyStateService.last90DaysAvgSSI(),
                today: await CommunityDailyStateService.notYetCountedToday(),
                totalBackers: await InflowService.countEvergreenBackers(),
                reachedLastMonth: await reachedAddressService.getAllReachedLast30Days(),
                growth: await globalGrowth.getLast(),
            });
        } catch (e) {
            reject(e);
        }
    });
    waitForResult
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};
const globalDemographics = (req: Request, res: Response) => {
    GlobalDemographicsService.getLast()
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

export default { globalStatus, globalDemographics };
