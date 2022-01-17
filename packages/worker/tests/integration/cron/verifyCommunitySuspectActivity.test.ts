import { database, interfaces, tests } from '@impactmarket/core';
import { expect } from 'chai';
import { Sequelize } from 'sequelize';
import Sinon, { stub } from 'sinon';

import { verifyCommunitySuspectActivity } from '../../../src/jobs/cron/community';

describe('[jobs - cron] verifyCommunitySuspectActivity', () => {
    let sequelize: Sequelize;
    let users: interfaces.app.appUser.AppUser[];
    let communities: interfaces.ubi.community.CommunityAttributes[];

    let ubiCommunitySuspectAddStub: Sinon.SinonStub;

    before(async () => {
        sequelize = tests.config.setup.sequelizeSetup();
        await sequelize.sync();

        ubiCommunitySuspectAddStub = stub(
            database.models.ubiCommunitySuspect,
            'bulkCreate'
        );
        ubiCommunitySuspectAddStub.returns(Promise.resolve());
    });

    after(async () => {
        await tests.config.setup.truncate(sequelize, 'Beneficiary');
        await tests.config.setup.truncate(sequelize);
    });

    beforeEach(async () => {
        await tests.config.setup.truncate(sequelize, 'Beneficiary');
        await tests.config.setup.truncate(sequelize, 'Community');
        ubiCommunitySuspectAddStub.reset();
    });

    it('with 100% (level 10) suspicious activity', async () => {
        users = await tests.factories.UserFactory({
            n: 5,
            props: Array(5).fill({ suspect: true }),
        });
        communities = await tests.factories.CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await tests.factories.BeneficiaryFactory(users, communities[0].id);

        await verifyCommunitySuspectActivity();
        const suspectActivity =
            await database.models.ubiCommunitySuspect.findAll({
                where: {
                    communityId: communities[0].id,
                },
            });

        expect(suspectActivity[0]).to.include({
            communityId: communities[0].id,
            percentage: 100,
            suspect: 10,
        });
    });

    it('with 1% (level 2) suspicious activity', async () => {
        users = await tests.factories.UserFactory({
            n: 100,
            props: Array(1).fill({ suspect: true }),
        });
        communities = await tests.factories.CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await tests.factories.BeneficiaryFactory(users, communities[0].id);

        await verifyCommunitySuspectActivity();
        const suspectActivity =
            await database.models.ubiCommunitySuspect.findAll({
                where: {
                    communityId: communities[0].id,
                },
            });

        expect(suspectActivity[0]).to.include({
            communityId: communities[0].id,
            percentage: 1,
            suspect: 2,
        });
    });

    it('with 14.29% (level 7) suspicious activity', async () => {
        users = await tests.factories.UserFactory({
            n: 35,
            props: Array(5).fill({ suspect: true }),
        });
        communities = await tests.factories.CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await tests.factories.BeneficiaryFactory(users, communities[0].id);

        await verifyCommunitySuspectActivity();
        const suspectActivity =
            await database.models.ubiCommunitySuspect.findAll({
                where: {
                    communityId: communities[0].id,
                },
            });

        expect(suspectActivity[0]).to.include({
            communityId: communities[0].id,
            percentage: 14.29,
            suspect: 7,
        });
    });

    it('with 50% (level 10) suspicious activity', async () => {
        users = await tests.factories.UserFactory({
            n: 10,
            props: Array(5).fill({ suspect: true }),
        });
        communities = await tests.factories.CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await tests.factories.BeneficiaryFactory(users, communities[0].id);

        await verifyCommunitySuspectActivity();
        const suspectActivity =
            await database.models.ubiCommunitySuspect.findAll({
                where: {
                    communityId: communities[0].id,
                },
            });

        expect(suspectActivity[0]).to.include({
            communityId: communities[0].id,
            percentage: 50,
            suspect: 10,
        });
    });

    it('without suspicious activity', async () => {
        users = await tests.factories.UserFactory({ n: 10 });
        communities = await tests.factories.CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        await tests.factories.BeneficiaryFactory(users, communities[0].id);

        await verifyCommunitySuspectActivity();
        const suspectActivity =
            await database.models.ubiCommunitySuspect.findAll({
                where: {
                    communityId: communities[0].id,
                },
            });

        expect(suspectActivity.length).to.be.equal(0);
    });
});
