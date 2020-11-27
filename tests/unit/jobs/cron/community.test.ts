import { stub, assert, spy } from 'sinon';

import BeneficiaryService from '../../../../src/services/beneficiary';
import CommunityDailyStateService from '../../../../src/services/communityDailyState';
import CommunityDailyMetricsService from '../../../../src/services/communityDailyMetrics';
import CommunityContractService from '../../../../src/services/communityContract';
import CommunityService from '../../../../src/services/community';
import SSIService from '../../../../src/services/ssi';
import { calcuateCommunitiesMetrics } from '../../../../src/jobs/cron/community';



describe('[jobs - cron] community', () => {

    // const userFindOneStub = stub(User, 'findOne');

    describe('#calcuateCommunitiesMetrics()', () => {
        it('all valid, non-empty communities, 30+ days', async () => {

            const communityIds = [
                'c77a15a7-2cef-4d1e-96db-afd0b91ab71d',
                'b090d41f-91c0-4f18-a809-633217590bbb',
                'a3b4ad6e-dc8e-4861-b5b2-c1973907c515',
            ];

            const activeBeneficiariesLast30Days = new Map<string, number>();
            activeBeneficiariesLast30Days.set(communityIds[0], 23);
            activeBeneficiariesLast30Days.set(communityIds[1], 5);
            activeBeneficiariesLast30Days.set(communityIds[2], 42);

            stub(BeneficiaryService, 'getActiveBeneficiariesLast30Days').returns(Promise.resolve(activeBeneficiariesLast30Days));


            const totalClaimedLast30Days = new Map<string, string>();

            totalClaimedLast30Days.set(communityIds[0], '1018500000000000000000');
            totalClaimedLast30Days.set(communityIds[1], '152000000000000000000');
            totalClaimedLast30Days.set(communityIds[2], '3796000000000000000000');

            stub(CommunityDailyStateService, 'getTotalClaimedLast30Days').returns(Promise.resolve(totalClaimedLast30Days));

            const ssiLast4Days = new Map<string, number[]>();
            ssiLast4Days.set(communityIds[0], [0.92, 0.87, 1.2, 1.5]);
            ssiLast4Days.set(communityIds[1], [1.3, 2.5, 2.3, 2]);
            ssiLast4Days.set(communityIds[2], [0.8, 0.9, 1.2, 1.3]);

            stub(CommunityDailyMetricsService, 'getSSILast4Days').returns(Promise.resolve(ssiLast4Days));

            // TODO: fix type
            const communitiesContract = new Map<string, any>();
            communitiesContract.set(communityIds[0], {
                claimAmount: '1500000000000000000',
                maxClaim: '1000000000000000000000',
                baseInterval: 86400,
                incrementInterval: 600
            });
            communitiesContract.set(communityIds[1], {
                claimAmount: '2000000000000000000',
                maxClaim: '1500000000000000000000',
                baseInterval: 86400,
                incrementInterval: 300
            });
            communitiesContract.set(communityIds[2], {
                claimAmount: '1000000000000000000',
                maxClaim: '600000000000000000000',
                baseInterval: 86400,
                incrementInterval: 900
            });
            stub(CommunityContractService, 'getAll').returns(Promise.resolve(communitiesContract));
            
            // TODO: fix type
            const allBeneficiariesInCommunity: any[] = [
                {
                    claims: 6,
                    lastClaimAt: new Date(),
                    penultimateClaimAt: new Date(),
                },
                {
                    claims: 2,
                    lastClaimAt: new Date(),
                    penultimateClaimAt: new Date(),
                },
                {
                    claims: 9,
                    lastClaimAt: new Date(),
                    penultimateClaimAt: new Date(),
                },
            ];

            stub(BeneficiaryService, 'getAllInCommunity').returns(Promise.resolve(allBeneficiariesInCommunity));
            
            // TODO: fix type
            const allCommunities: any[] = [
                {
                    publicId: 'c77a15a7-2cef-4d1e-96db-afd0b91ab71d',
                    state: {
                        claimed: '1',
                        raised: '1',
                    },
                    contractParams: {
                        baseInterval: 86400,
                        incrementInterval: 600,
                    },
                    started: new Date(),
                },
                {
                    publicId: 'b090d41f-91c0-4f18-a809-633217590bbb',
                    state: {
                        claimed: '1',
                        raised: '1',
                    },
                    contractParams: {
                        baseInterval: 86400,
                        incrementInterval: 300,
                    },
                    started: new Date(),
                },
                {
                    publicId: 'a3b4ad6e-dc8e-4861-b5b2-c1973907c515',
                    state: {
                        claimed: '1',
                        raised: '1',
                    },
                    contractParams: {
                        baseInterval: 86400,
                        incrementInterval: 900,
                    },
                    started: new Date(),
                },
            ];
            stub(CommunityService, 'getAll').returns(Promise.resolve(allCommunities));
            
            
            // result doesn't matter
            const dailyMetricsAdd = stub(CommunityDailyMetricsService, 'add')
            dailyMetricsAdd.returns(Promise.resolve({} as any));
            // TODO: remove
            stub(SSIService, 'add').returns(Promise.resolve({} as any));
            
            
            await calcuateCommunitiesMetrics();
            dailyMetricsAdd.restore();
            assert.calledWith(dailyMetricsAdd.secondCall, 'b090d41f-91c0-4f18-a809-633217590bbb', -50.06, -8.39, -30.4, -1.64, new Date(new Date().getTime() - 86400000));
        });
    });
});