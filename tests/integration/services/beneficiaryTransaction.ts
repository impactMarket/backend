import { Op, Sequelize } from 'sequelize';
import { assert, spy, stub } from 'sinon';
import tk from 'timekeeper';

import { models } from '../../../src/database';
import * as merkleTree from '../../../src/worker/jobs/cron/filters/merkleTree';
import { cleanupNetworkRewards } from '../../../src/worker/jobs/cron/network';
import BeneficiaryFactory from '../../factories/beneficiary';
import BeneficiaryTransactionFactory from '../../factories/beneficiaryTransaction';
import CommunityFactory from '../../factories/community';
import UserFactory from '../../factories/user';
import truncate, { sequelizeSetup } from '../../utils/sequelizeSetup';
import { jumpToTomorrowMidnight } from '../../utils/utils';

describe('beneficiary transactions', () => {
    let sequelize: Sequelize;
    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
    });

    after(async () => {
        await truncate(sequelize, 'AppUserModel');
        await truncate(sequelize, 'Manager');
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize);
    });

    it('(cleanupNetworkRewards) must remove merkle tree transactions', async () => {
        // prepare
        tk.travel(jumpToTomorrowMidnight());
        const users = await UserFactory({ n: 7 });
        const communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                hasAddress: true,
            },
        ]);
        const beneficiaries = await BeneficiaryFactory(
            users.slice(0, 5),
            communities[0].publicId
        );
        // add fake transactions
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            withAddress: users[5].address,
            amount: '1000000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[1], true, {
            withAddress: users[6].address,
            amount: '1000000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[4], true, {
            withAddress: users[3].address,
            amount: '1000000000000000000',
        });
        const tree1 = await BeneficiaryTransactionFactory(
            beneficiaries[2],
            true,
            {
                amount: '1000000000000000000',
            }
        );
        const tree2 = await BeneficiaryTransactionFactory(
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
            models.beneficiaryTransaction,
            'destroy'
        );
        tk.travel(jumpToTomorrowMidnight());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today.getDate() - 1);
        // test

        await cleanupNetworkRewards();

        assert.callCount(beneficiaryTransactionDestroy, 1);
        assert.calledWith(beneficiaryTransactionDestroy.getCall(0), {
            where: {
                createdAt: {
                    [Op.between]: [yesterday, today],
                },
                withAddress: {
                    [Op.in]: [tree1.withAddress, tree2.withAddress],
                },
            },
        });
    });
});
