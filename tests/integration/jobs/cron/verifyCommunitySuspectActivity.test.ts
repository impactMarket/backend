import { Sequelize } from 'sequelize';
import Sinon, { stub, assert } from 'sinon';

import { models } from '../../../../src/database';
import { CommunityAttributes } from '../../../../src/database/models/ubi/community';
import { AppUser } from '../../../../src/interfaces/app/appUser';
import { verifyCommunitySuspectActivity } from '../../../../src/worker/jobs/cron/community';
import BeneficiaryFactory from '../../../factories/beneficiary';
import CommunityFactory from '../../../factories/community';
import UserFactory from '../../../factories/user';
import truncate, { sequelizeSetup } from '../../../utils/sequelizeSetup';

describe('[jobs - cron] verifyCommunitySuspectActivity', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communities: CommunityAttributes[];

    let ubiCommunitySuspectAddStub: Sinon.SinonStub<any, Promise<void>>;

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        ubiCommunitySuspectAddStub = stub(models.ubiCommunitySuspect, 'create');
        ubiCommunitySuspectAddStub.returns(Promise.resolve());
    });

    after(async () => {
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize);
    });

    beforeEach(async () => {
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize, 'Community');
        ubiCommunitySuspectAddStub.reset();
    });

    it('with 100% (level 10) suspicious activity', async () => {
        users = await UserFactory({
            n: 5,
            props: Array(5).fill({ suspect: true }),
        });
        communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await BeneficiaryFactory(users, communities[0].publicId);

        await verifyCommunitySuspectActivity();
        assert.callCount(ubiCommunitySuspectAddStub, 1);
        assert.calledWith(
            ubiCommunitySuspectAddStub.getCall(0),
            {
                communityId: communities[0].id,
                percentage: 100,
                suspect: 10,
            },
            { returning: false }
        );
    });

    it('with 1% (level 2) suspicious activity', async () => {
        users = await UserFactory({
            n: 100,
            props: Array(1).fill({ suspect: true }),
        });
        communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await BeneficiaryFactory(users, communities[0].publicId);

        await verifyCommunitySuspectActivity();
        assert.callCount(ubiCommunitySuspectAddStub, 1);
        assert.calledWith(
            ubiCommunitySuspectAddStub.getCall(0),
            {
                communityId: communities[0].id,
                percentage: 1,
                suspect: 2,
            },
            { returning: false }
        );
    });

    it('with 14.29% (level 7) suspicious activity', async () => {
        users = await UserFactory({
            n: 35,
            props: Array(5).fill({ suspect: true }),
        });
        communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await BeneficiaryFactory(users, communities[0].publicId);

        await verifyCommunitySuspectActivity();
        assert.callCount(ubiCommunitySuspectAddStub, 1);
        assert.calledWith(
            ubiCommunitySuspectAddStub.getCall(0),
            {
                communityId: communities[0].id,
                percentage: 14.29,
                suspect: 7,
            },
            { returning: false }
        );
    });

    it('with 50% (level 10) suspicious activity', async () => {
        users = await UserFactory({
            n: 10,
            props: Array(5).fill({ suspect: true }),
        });
        communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await BeneficiaryFactory(users, communities[0].publicId);

        await verifyCommunitySuspectActivity();
        assert.callCount(ubiCommunitySuspectAddStub, 1);
        assert.calledWith(
            ubiCommunitySuspectAddStub.getCall(0),
            {
                communityId: communities[0].id,
                percentage: 50,
                suspect: 10,
            },
            { returning: false }
        );
    });

    it('without suspicious activity', async () => {
        users = await UserFactory({ n: 10 });
        communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await BeneficiaryFactory(users, communities[0].publicId);

        await verifyCommunitySuspectActivity();
        assert.callCount(ubiCommunitySuspectAddStub, 0);
    });
});
