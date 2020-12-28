import { stub, assert, match } from 'sinon';

import BeneficiaryService from '../../../../src/api/services/beneficiary';
import CommunityDailyStateService from '../../../../src/api/services/communityDailyState';
import CommunityDailyMetricsService from '../../../../src/api/services/communityDailyMetrics';
import CommunityContractService from '../../../../src/api/services/communityContract';
import CommunityService from '../../../../src/api/services/community';
import SSIService from '../../../../src/api/services/ssi';
import { calcuateCommunitiesMetrics } from '../../../../src/worker/jobs/cron/community';
import { activeBeneficiariesLast30Days, allBeneficiariesInCommunity } from '../../../fake/beneficiary';
import { validNonEmptyMonthLongCommunities, communitiesContract, ssiLast4Days, totalClaimedLast30Days, communityIds } from '../../../fake/community';



describe('[jobs - cron] community', () => {

    // const userFindOneStub = stub(User, 'findOne');

    describe('#calcuateCommunitiesMetrics()', () => {
        let dailyMetricsAdd;
        before(() => {
            // result doesn't matter
            dailyMetricsAdd = stub(CommunityDailyMetricsService, 'add');
            dailyMetricsAdd.returns(Promise.resolve({} as any));
            // TODO: remove
            stub(SSIService, 'add').returns(Promise.resolve({} as any));

            //
            stub(BeneficiaryService, 'getActiveBeneficiariesLast30Days').returns(Promise.resolve(activeBeneficiariesLast30Days));
            stub(CommunityDailyStateService, 'getTotalClaimedLast30Days').returns(Promise.resolve(totalClaimedLast30Days));
            stub(CommunityDailyMetricsService, 'getSSILast4Days').returns(Promise.resolve(ssiLast4Days));
            stub(CommunityContractService, 'getAll').returns(Promise.resolve(communitiesContract));
            const allInCommunity = stub(BeneficiaryService, 'listActiveInCommunity');
            for (let x = 0; x < communityIds.length; x += 1) {
                allInCommunity.withArgs(communityIds[x]).returns(Promise.resolve(allBeneficiariesInCommunity[x]));
            }
        });

        it('all valid, non-empty communities, 30+ days', async () => {
            stub(CommunityService, 'getAll').returns(Promise.resolve(validNonEmptyMonthLongCommunities));

            // run!
            await calcuateCommunitiesMetrics();

            // assert
            assert.callCount(dailyMetricsAdd, validNonEmptyMonthLongCommunities.length);
            assert.calledWith(dailyMetricsAdd.getCall(0), 'c77a15a7-2cef-4d1e-96db-afd0b91ab71d', 1.75, 1.25, 1.18, 42.37, match.any);
            assert.calledWith(dailyMetricsAdd.getCall(1), 'b090d41f-91c0-4f18-a809-633217590bbb', 2.45, 2.11, 0.3, 66.66, match.any);
            assert.calledWith(dailyMetricsAdd.getCall(2), 'a3b4ad6e-dc8e-4861-b5b2-c1973907c515', 1.06, 1.05, 0.44, 22.72, match.any);
        });
    });
});