import { database, tests } from '@impactmarket/core';
import { Op, Sequelize } from 'sequelize';
import { assert, spy, stub, restore } from 'sinon';
import tk from 'timekeeper';

import * as merkleTree from '../../src/jobs/cron/filters/merkleTree';
import { cleanupNetworkRewards } from '../../src/jobs/cron/network';

describe('beneficiary transactions', () => {
    let sequelize: Sequelize;
    before(async () => {
        sequelize = tests.config.setup.sequelizeSetup();
        await sequelize.sync();
    });

    after(async () => {
        await tests.config.setup.truncate(sequelize, 'AppUserModel');
        await tests.config.setup.truncate(sequelize, 'Manager');
        await tests.config.setup.truncate(sequelize, 'Beneficiary');
        await tests.config.setup.truncate(sequelize);
        restore()
    });

    it('(cleanupNetworkRewards) must remove merkle tree transactions', async () => {
        // prepare
        tk.travel(tests.config.utils.jumpToTomorrowMidnight());
        const users = await tests.factories.UserFactory({ n: 7 });
        const communities = await tests.factories.CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        const beneficiaries = await tests.factories.BeneficiaryFactory(
            users.slice(0, 5),
            communities[0].id
        );
        // add fake transactions
        await tests.factories.BeneficiaryTransactionFactory(
            beneficiaries[0],
            true,
            {
                withAddress: users[5].address,
                amount: '1000000000000000000',
            }
        );
        await tests.factories.BeneficiaryTransactionFactory(
            beneficiaries[1],
            true,
            {
                withAddress: users[6].address,
                amount: '1000000000000000000',
            }
        );
        await tests.factories.BeneficiaryTransactionFactory(
            beneficiaries[4],
            true,
            {
                withAddress: users[3].address,
                amount: '1000000000000000000',
            }
        );
        const tree1 = await tests.factories.BeneficiaryTransactionFactory(
            beneficiaries[2],
            true,
            {
                amount: '1000000000000000000',
            }
        );
        const tree2 = await tests.factories.BeneficiaryTransactionFactory(
            beneficiaries[3],
            true,
            {
                amount: '1000000000000000000',
            }
        );
        stub(merkleTree, 'filterMerkleTree').returns(
            Promise.resolve([tree1.withAddress, tree2.withAddress])
        );
        const beneficiaryTransactionDestroy = spy(
            database.models.ubiBeneficiaryTransaction,
            'destroy'
        );
        tk.travel(tests.config.utils.jumpToTomorrowMidnight());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        // test

        await cleanupNetworkRewards();

        assert.callCount(beneficiaryTransactionDestroy, 1);
        assert.calledWith(beneficiaryTransactionDestroy.getCall(0), {
            where: {
                withAddress: {
                    [Op.in]: [tree1.withAddress, tree2.withAddress],
                },
            },
        });
    });
});
