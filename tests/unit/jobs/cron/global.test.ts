import { stub, assert, match } from 'sinon';

import { GlobalDailyState } from '../../../../src/database/models/globalDailyState';
import BeneficiaryTransactionService from '../../../../src/services/beneficiaryTransaction';
import ClaimService from '../../../../src/services/claim';
import CommunityContractService from '../../../../src/services/communityContract';
import CommunityDailyMetricsService from '../../../../src/services/communityDailyMetrics';
import CommunityDailyStateService from '../../../../src/services/communityDailyState';
import GlobalDailyStateService from '../../../../src/services/globalDailyState';
import GlobalGrowthService from '../../../../src/services/globalGrowth';
import InflowService from '../../../../src/services/inflow';
import ReachedAddressService from '../../../../src/services/reachedAddress';
import { calcuateGlobalMetrics } from '../../../../src/worker/jobs/cron/global';

const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const getLastStub = new GlobalDailyState({
    date: twoDaysAgo,
    avgMedianSSI: 3.78,
    claimed: '7665100000000000000000',
    claims: 5067,
    beneficiaries: 151,
    raised: '3006549862756260104200',
    backers: 33,
    volume: '5369920072262451756585',
    transactions: 379,
    reach: 92,
    reachOut: 92,
    totalRaised: '211233480572099278505565',
    totalDistributed: '186740600000000000000000',
    totalBackers: 67,
    totalBeneficiaries: 9790,
    givingRate: 166.12,
    ubiRate: 0.65,
    fundingRate: 11.89,
    spendingRate: 0,
    avgComulativeUbi: '442500000000000000000',
    avgUbiDuration: 31.26191489361702,
    totalVolume: '184102698397357417421594',
    totalTransactions: BigInt(7559),
    totalReach: BigInt(665),
    totalReachOut: BigInt(665),
});
const getLast4AvgMedianSSIStub = [3.78, 3.74, 3.68, 3.58];

const getPublicCommunitiesSumStub = {
    totalClaimed: '5185700000000000000000',
    totalClaims: 3429,
    totalBeneficiaries: 12,
    totalRaised: '500563073064460026000',
};

const getAllByDayStub = {
    reach: [
        '0x00149D44b8CEf75edaeE02bdCF13024593DE9B26',
        '0x01CB0ECBB069746d940B164b19Dc6BE64E1d880c',
        '0x02185D68B3eFf0CD24027E0DF628F3Fd73223A87',
        '0x024D91705dC51A0adab92ac7aEcC5194B18DDeC8',
        '0x089e351DF4E71A8bB534c3703F7f2f7Adb024f27',
        '0x0b645CEd834760589cCA93bf0A90585B7266da79',
        '0x154FA1F87a67199fE721082d239145337879b50f',
    ],
    reachOut: [
        '0x1901b925462E7A5DC37D460618761eAeC04c96Cb',
        '0x28c03376e6182d8633F7076179acd62Eb8648704',
        '0x2A863742ce2B5e07629895d487d454B053C61e49',
    ],
    volume: '3697272742970310062948',
    transactions: 237,
};

const uniqueBackersAndFundingLast30DaysStub = {
    backers: 35,
    funding: '163849388841439562449690',
};

const getCommunitiesAvgStub = {
    medianSSI: 3.71,
    avgUbiRate: 0.67,
    avgEstimatedDuration: 30.35,
};

describe('[jobs - cron] global', () => {
    describe('#calcuateGlobalMetrics()', () => {
        before(() => {
            //
            stub(GlobalDailyStateService.prototype, 'getLast').returns(
                Promise.resolve(getLastStub)
            );
            stub(
                GlobalDailyStateService.prototype,
                'getLast4AvgMedianSSI'
            ).returns(Promise.resolve(getLast4AvgMedianSSIStub));
            stub(CommunityDailyStateService, 'getPublicCommunitiesSum').returns(
                Promise.resolve(getPublicCommunitiesSumStub)
            );
            stub(BeneficiaryTransactionService, 'getAllByDay').returns(
                Promise.resolve(getAllByDayStub)
            );
            stub(InflowService, 'uniqueBackersAndFundingLast30Days').returns(
                Promise.resolve(uniqueBackersAndFundingLast30DaysStub)
            );
            stub(CommunityDailyMetricsService, 'getCommunitiesAvg').returns(
                Promise.resolve(getCommunitiesAvgStub)
            );
            stub(ClaimService, 'getMonthlyClaimed').returns(
                Promise.resolve('143745800000000000000000')
            );
            stub(InflowService, 'getMonthlyRaised').returns(
                Promise.resolve('163849388841439562449690')
            );
            stub(InflowService, 'countEvergreenBackers').returns(
                Promise.resolve(69)
            );
            stub(CommunityContractService, 'avgComulativeUbi').returns(
                Promise.resolve('442500000000000000000')
            );
            stub(ReachedAddressService.prototype, 'updateReachedList').returns(
                Promise.resolve({} as any)
            );
            stub(ReachedAddressService.prototype, 'getAllReachedEver').returns(
                Promise.resolve({ reach: 665, reachOut: 665 })
            );
            const stubSumLast30Days = stub(
                GlobalDailyStateService.prototype,
                'sumLast30Days'
            );
            const yesterday = new Date();
            yesterday.setHours(0, 0, 0, 0);
            yesterday.setDate(yesterday.getDate() - 1);
            stubSumLast30Days.withArgs(yesterday).returns(
                Promise.resolve({
                    tClaims: 52421,
                    tClaimed: '79464400000000000000000',
                    tBeneficiaries: 6763,
                    tRaised: '86384403789187482153516',
                    tBackers: 375,
                    fundingRate: 5.8,
                    tVolume: '80975441365828470343681',
                    tTransactions: '2735',
                    tReach: '686',
                    tReachOut: '130',
                })
            );
            const aMonthFromYesterday = new Date();
            aMonthFromYesterday.setHours(0, 0, 0, 0);
            aMonthFromYesterday.setDate(yesterday.getDate() - 30);
            stubSumLast30Days.withArgs(aMonthFromYesterday).returns(
                Promise.resolve({
                    tClaims: 24900,
                    tClaimed: '39049100000000000000000',
                    tBeneficiaries: 2124,
                    tRaised: '41909001281644819448514',
                    tBackers: 474,
                    fundingRate: 4.2,
                    tVolume: '18098665364949858856154',
                    tTransactions: '673',
                    tReach: '235',
                    tReachOut: '32',
                })
            );
            stub(GlobalGrowthService.prototype, 'add').returns(
                Promise.resolve({} as any)
            );
        });

        it('all valid, non-empty communities, 30+ days', async () => {
            const globalAddStub = stub(
                GlobalDailyStateService.prototype,
                'add'
            );
            // run!
            await calcuateGlobalMetrics();

            // assert
            assert.callCount(globalAddStub, 1);
            assert.calledWith(globalAddStub.getCall(0), {
                date: match.any,
                avgMedianSSI: 3.7,
                claimed: '5185700000000000000000',
                claims: 3429,
                beneficiaries: 12,
                raised: '500563073064460026000',
                backers: 35,
                volume: '3697272742970310062948',
                transactions: 237,
                reach: 7,
                reachOut: 3,
                totalRaised: '211734043645163738531565',
                totalDistributed: '191926300000000000000000',
                totalBackers: 69,
                totalBeneficiaries: 9802,
                givingRate: 156.04,
                ubiRate: 0.67,
                fundingRate: 12.26,
                spendingRate: 0,
                avgComulativeUbi: '442500000000000000000',
                avgUbiDuration: 30.35,
                totalVolume: '187799971140327727484542',
                totalTransactions: BigInt(7796),
                totalReach: BigInt(665),
                totalReachOut: BigInt(665),
            });
        });
    });
});
