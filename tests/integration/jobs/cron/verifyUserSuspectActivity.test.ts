import { Op, Sequelize } from 'sequelize';
import { stub, assert } from 'sinon';

import { models } from '../../../../src/database';
import { verifyUserSuspectActivity } from '../../../../src/worker/jobs/cron/user';
import truncate, { sequelizeSetup } from '../../../utils/sequelizeSetup';

// in this test there are users being assined with suspicious activity and others being removed
describe('[jobs - cron] verifyUserSuspectActivity', () => {
    let sequelize: Sequelize;
    let tIds: any[];
    let user: any[];
    before(async () => {
        sequelize = sequelizeSetup();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

        user = await sequelize.models.UserModel.bulkCreate([
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                suspect: false,
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                suspect: false,
            },
            {
                address: '0x012D33893983E187814Be1bdBe9852299829C554',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                suspect: false,
            },
            {
                address: '0xc55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                suspect: true, // was suspect before
            },
            {
                address: '0x102D33893983E187814Be1bdBe9852299829C554',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                suspect: false,
            },
        ]);

        const r = await sequelize.models.AppUserTrustModel.bulkCreate([
            {
                phone: '00351969696966',
                verifiedPhoneNumber: false,
            },
            {
                phone: '00351969696966',
                verifiedPhoneNumber: false,
            },
            {
                phone: '00351969696967',
                verifiedPhoneNumber: false,
            },
            {
                phone: '00351969696968',
                verifiedPhoneNumber: false,
            },
            {
                phone: '00351969696969',
                verifiedPhoneNumber: false,
            },
            {
                phone: '00351969696970',
                verifiedPhoneNumber: false,
            },
        ]);
        tIds = r.map((ids) => ids.toJSON());

        await sequelize.models.AppUserThroughTrustModel.bulkCreate([
            {
                userAddress: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                appUserTrustId: tIds[0].id,
            },
            {
                userAddress: '0x002D33893983E187814Be1bdBe9852299829C554',
                appUserTrustId: tIds[1].id,
            },
            {
                userAddress: '0x012D33893983E187814Be1bdBe9852299829C554',
                appUserTrustId: tIds[2].id,
            },
            {
                userAddress: '0xc55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                appUserTrustId: tIds[3].id,
            },
            {
                userAddress: '0x102D33893983E187814Be1bdBe9852299829C554',
                appUserTrustId: tIds[4].id,
            },
            {
                userAddress: '0x102D33893983E187814Be1bdBe9852299829C554',
                appUserTrustId: tIds[5].id,
            },
        ]);
    });

    after(async () => {
        await sequelize.models.AppUserThroughTrustModel.destroy({
            where: {},
        });
        await sequelize.models.AppUserTrustModel.destroy({
            where: {},
        });
        await sequelize.models.UserModel.destroy({
            where: {},
        });
    });

    it('with suspicious activity', async () => {
        const userUpdateStub = stub(models.user, 'update');
        userUpdateStub.returns(Promise.resolve({} as any));
        await verifyUserSuspectActivity();
        assert.callCount(userUpdateStub, 3);
        assert.calledWith(
            userUpdateStub,
            {
                suspect: true,
            },
            {
                where: { address: user[0].address },
                returning: false,
            }
        );
        assert.calledWith(
            userUpdateStub,
            {
                suspect: true,
            },
            {
                where: { address: user[1].address },
                returning: false,
            }
        );
        assert.calledWith(
            userUpdateStub,
            {
                suspect: false,
            },
            {
                where: { address: user[3].address },
                returning: false,
            }
        );
        userUpdateStub.restore();
    });

    // TODO: devide in two tests, one to find suspect, one to remove
});
