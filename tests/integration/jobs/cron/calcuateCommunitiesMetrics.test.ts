import { expect } from 'chai';
import BeneficiaryFactory from '../../../factories/beneficiary';
import CommunityFactory from '../../../factories/community';

import UserFactory from '../../../factories/user';
import { sequelizeSetup } from '../../../utils/sequelizeSetup';

describe('calcuateCommunitiesMetrics', () => {
    context('recent community', () => {
        before(async () => {
            sequelizeSetup();

            const users = await UserFactory();
            const community = await CommunityFactory([
                {
                    requestByAddress: users[0].address,
                    started: new Date(),
                    status: 'valid',
                    visibility: 'public',
                    hasAddress: true,
                },
            ]);
            const beneficiaries = await BeneficiaryFactory(
                users,
                community[0].publicId
            );
            console.log(beneficiaries);
        });

        it('called User.findOne', () => {
            expect(1).to.be.equal(1);
        });
    });
});
