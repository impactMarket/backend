import { utils, services } from 'impactmarket-core';
import { Request, Response } from 'express';

const reachedAddressService = new services.ReachedAddressService();
const globalGrowth = new services.global.GlobalGrowthService();
const globalDailyStateService = new services.global.GlobalDailyStateService();

const globalStatus = (req: Request, res: Response) => {
    const waitForResult = new Promise(async (resolve, reject) => {
        try {
            resolve({
                monthly: await globalDailyStateService.getLast30Days(),
                lastQuarterAvgSSI:
                    await globalDailyStateService.last90DaysAvgSSI(),
                today: await globalDailyStateService.notYetCountedToday(),
                totalBackers: await services.ubi.InflowService.countEvergreenBackers(),
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
        .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
};
const globalDemographics = (req: Request, res: Response) => {
    services.global.GlobalDemographicsService.getLast()
        .then((r) => res.send(r))
        .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
};
const numbers = (req: Request, res: Response) => {
    globalDailyStateService
        .numbers()
        .then((r) => utils.api.standardResponse(res, 200, true, r))
        .catch((e) => utils.api.standardResponse(res, 400, false, '', { error: e }));
};

export default { globalStatus, globalDemographics, numbers };