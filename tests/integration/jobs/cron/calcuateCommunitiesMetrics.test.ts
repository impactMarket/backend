// import { expect } from 'chai';
import { Sequelize } from 'sequelize';

import { calcuateCommunitiesMetrics } from '../../../../src/worker/jobs/cron/community';
import BeneficiaryFactory from '../../../factories/beneficiary';
import ClaimFactory from '../../../factories/claim';
import CommunityFactory from '../../../factories/community';
import InflowFactory from '../../../factories/inflow';
import UserFactory from '../../../factories/user';
import truncate, { sequelizeSetup } from '../../../utils/sequelizeSetup';

describe('calcuateCommunitiesMetrics', () => {
    context('recent community', () => {
        let sequelize: Sequelize;
        before(async () => {
            sequelize = sequelizeSetup();

            const users = await UserFactory({ n: 2 });
            const communities = await CommunityFactory([
                {
                    requestByAddress: users[0].address,
                    started: new Date(),
                    status: 'valid',
                    visibility: 'public',
                    contract: {
                        baseInterval: 60 * 60 * 24,
                        claimAmount: '1000000000000000000',
                        communityId: 0,
                        incrementInterval: 5 * 60,
                        maxClaim: '25000000000000000000',
                    },
                    hasAddress: true,
                },
            ]);
            const community = {
                ...communities[0],
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: '1000000000000000000',
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim: '25000000000000000000',
                },
            };
            await InflowFactory(community);
            await InflowFactory(community);
            const beneficiaries = await BeneficiaryFactory(
                users,
                community.publicId
            );
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[1], community);
            await ClaimFactory(beneficiaries[1], community);
        });

        after(async () => {
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'UserModel');
            await truncate(sequelize, 'Community');
        });

        it('called User.findOne', async () => {
            await calcuateCommunitiesMetrics();
            // expect(1).to.be.equal(1);
        });
    });
});
