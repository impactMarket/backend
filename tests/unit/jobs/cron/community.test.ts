import { stub, assert, match } from 'sinon';

import BeneficiaryService from '../../../../src/services/beneficiary';
import CommunityService from '../../../../src/services/community';
import CommunityContractService from '../../../../src/services/communityContract';
import CommunityDailyMetricsService from '../../../../src/services/communityDailyMetrics';
import CommunityDailyStateService from '../../../../src/services/communityDailyState';
import { calcuateCommunitiesMetrics } from '../../../../src/worker/jobs/cron/community';
import {
    activeBeneficiariesLast30Days,
    allBeneficiariesInCommunity,
} from '../../../fake/beneficiary';
import {
    validNonEmptyMonthLongCommunities,
    communitiesContract,
    ssiLast4Days,
    totalClaimedLast30Days,
    communityIds,
    validNonEmptyLessThanMonthLongCommunities,
    validEmptyCommunities,
} from '../../../fake/community';

describe('[jobs - cron] community', () => {
    // const userFindOneStub = stub(User, 'findOne');

    describe('#calcuateCommunitiesMetrics()', () => {
        let dailyMetricsAdd;
        const listFullStub = stub(CommunityService, 'listFull');
        before(() => {
            //
            stub(
                BeneficiaryService,
                'getActiveBeneficiariesLast30Days'
            ).returns(Promise.resolve(activeBeneficiariesLast30Days));
            stub(
                CommunityDailyStateService,
                'getTotalClaimedLast30Days'
            ).returns(Promise.resolve(totalClaimedLast30Days));
            stub(CommunityDailyMetricsService, 'getSSILast4Days').returns(
                Promise.resolve(ssiLast4Days)
            );
            stub(CommunityContractService, 'getAll').returns(
                Promise.resolve(communitiesContract)
            );
            const allInCommunity = stub(
                BeneficiaryService,
                'listActiveInCommunity'
            );
            for (let x = 0; x < communityIds.length; x += 1) {
                allInCommunity
                    .withArgs(communityIds[x])
                    .returns(Promise.resolve(allBeneficiariesInCommunity[x]));
            }
        });

        beforeEach(() => {
            // result doesn't matter
            dailyMetricsAdd = stub(CommunityDailyMetricsService, 'add');
            dailyMetricsAdd.returns(Promise.resolve({} as any));
        });

        afterEach(() => {
            dailyMetricsAdd.restore();
        });

        it('all valid, non-empty communities, 30+ days', async () => {
            listFullStub.returns(
                Promise.resolve(validNonEmptyMonthLongCommunities)
            );

            // run!
            await calcuateCommunitiesMetrics();

            // assert
            assert.callCount(
                dailyMetricsAdd,
                validNonEmptyMonthLongCommunities.length
            );
            assert.calledWith(
                dailyMetricsAdd.getCall(0),
                validNonEmptyMonthLongCommunities[0].publicId,
                1.75,
                1.25,
                1.18,
                42.37,
                match.any
            );
            assert.calledWith(
                dailyMetricsAdd.getCall(1),
                validNonEmptyMonthLongCommunities[1].publicId,
                2.45,
                2.11,
                0.3,
                66.66,
                match.any
            );
            assert.calledWith(
                dailyMetricsAdd.getCall(2),
                validNonEmptyMonthLongCommunities[2].publicId,
                1.06,
                1.05,
                0.44,
                22.72,
                match.any
            );
        });

        it('all valid, non-empty communities, <30 days', async () => {
            listFullStub.returns(
                Promise.resolve(validNonEmptyLessThanMonthLongCommunities)
            );

            // run!
            await calcuateCommunitiesMetrics();

            // assert
            assert.callCount(
                dailyMetricsAdd,
                validNonEmptyLessThanMonthLongCommunities.length
            );
            assert.calledWith(
                dailyMetricsAdd.getCall(0),
                validNonEmptyLessThanMonthLongCommunities[0].publicId,
                2.03,
                1.43,
                1.08,
                9.25,
                match.any
            );
            assert.calledWith(
                dailyMetricsAdd.getCall(1),
                validNonEmptyLessThanMonthLongCommunities[1].publicId,
                2.45,
                0.91,
                0.14,
                71.42,
                match.any
            );
        });

        it('all valid, empty communities', async () => {
            listFullStub.returns(Promise.resolve(validEmptyCommunities));

            // run!
            await calcuateCommunitiesMetrics();

            // assert
            assert.callCount(dailyMetricsAdd, 0);
        });
    });
});
