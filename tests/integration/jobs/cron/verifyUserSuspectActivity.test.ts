import { Op, Sequelize } from 'sequelize';
import { stub, assert } from 'sinon';

import { models } from '../../../../src/database';
import { initializeAppUserThroughTrust } from '../../../../src/database/models/app/appUserThroughTrust';
import { initializeAppUserTrust } from '../../../../src/database/models/app/appUserTrust';
import { initializeUser } from '../../../../src/database/models/app/user';
import { verifyUserSuspectActivity } from '../../../../src/worker/jobs/cron/user';

// in this test there are users being assined with suspicious activity and others being removed
describe('[jobs - cron] verifyUserSuspectActivity', () => {
    let sequelize;
    let tIds: any[];
    before(async () => {
        const dbConfig: any = {
            dialect: 'postgres',
            protocol: 'postgres',
            native: true,
            logging: false,
        };
        sequelize = new Sequelize(process.env.DATABASE_URL!, dbConfig);

        initializeUser(sequelize);
        initializeAppUserThroughTrust(sequelize);
        initializeAppUserTrust(sequelize);

        // used to query from the user with incude
        sequelize.models.UserModel.belongsToMany(
            sequelize.models.AppUserTrustModel,
            {
                through: sequelize.models.AppUserThroughTrustModel,
                foreignKey: 'userAddress',
                sourceKey: 'address',
                as: 'throughTrust',
            }
        );
        // used to query from the AppUserTrust with incude
        sequelize.models.AppUserTrustModel.belongsToMany(
            sequelize.models.UserModel,
            {
                through: sequelize.models.AppUserThroughTrustModel,
                foreignKey: 'appUserTrustId',
                sourceKey: 'id',
                as: 'throughTrust',
            }
        );
        // self association to find repeated values on those keys
        sequelize.models.AppUserTrustModel.hasMany(
            sequelize.models.AppUserTrustModel,
            {
                foreignKey: 'phone',
                sourceKey: 'phone',
                as: 'selfTrust',
            }
        );

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

        await sequelize.models.UserModel.bulkCreate([
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x012D33893983E187814Be1bdBe9852299829C554',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0xc55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x102D33893983E187814Be1bdBe9852299829C554',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const r = await sequelize.models.AppUserTrustModel.bulkCreate([
            {
                phone: '00351969696966',
                verifiedPhoneNumber: false,
                suspect: false,
            },
            {
                phone: '00351969696966',
                verifiedPhoneNumber: false,
                suspect: false,
            },
            {
                phone: '00351969696967',
                verifiedPhoneNumber: false,
                suspect: false,
            },
            {
                phone: '00351969696968',
                verifiedPhoneNumber: false,
                suspect: true, // was suspect previously
            },
            {
                phone: '00351969696969',
                verifiedPhoneNumber: false,
                suspect: false,
            },
            {
                phone: '00351969696970',
                verifiedPhoneNumber: false,
                suspect: false,
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
        const appUserTrustUpdateStub = stub(models.appUserTrust, 'update');
        appUserTrustUpdateStub.returns(Promise.resolve({} as any));
        await verifyUserSuspectActivity();
        assert.callCount(appUserTrustUpdateStub, 3);
        assert.calledWith(
            appUserTrustUpdateStub.getCall(0),
            {
                suspect: true,
            },
            {
                where: { id: { [Op.in]: [tIds[0].id] } },
                returning: false,
            }
        );
        assert.calledWith(
            appUserTrustUpdateStub.getCall(1),
            {
                suspect: true,
            },
            {
                where: { id: { [Op.in]: [tIds[1].id] } },
                returning: false,
            }
        );
        assert.calledWith(
            appUserTrustUpdateStub.getCall(2),
            {
                suspect: false,
            },
            {
                where: { id: { [Op.in]: [tIds[3].id] } },
                returning: false,
            }
        );
    });

    // TODO: devide in two tests, one to find suspect, one to remove
});
