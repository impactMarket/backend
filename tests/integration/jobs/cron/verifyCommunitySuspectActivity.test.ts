import { Sequelize } from 'sequelize';
import { stub, assert, match } from 'sinon';

import { models } from '../../../../src/database';
import { initializeAppUserThroughTrust } from '../../../../src/database/models/app/appUserThroughTrust';
import { initializeAppUserTrust } from '../../../../src/database/models/app/appUserTrust';
import { initializeUser } from '../../../../src/database/models/app/user';
import { initializeBeneficiary } from '../../../../src/database/models/ubi/beneficiary';
import { initializeCommunity } from '../../../../src/database/models/ubi/community';
import { initializeUbiCommunitySuspect } from '../../../../src/database/models/ubi/ubiCommunitySuspect';
import { verifyCommunitySuspectActivity } from '../../../../src/worker/jobs/cron/community';

// in this test there are 3 communities
// onw with past suspicious activities, not having anymore
// one without suspicious activity
// one with new suspicious activity
describe('[jobs - cron] verifyCommunitySuspectActivity', () => {
    let sequelize;
    before(async () => {
        const dbConfig: any = {
            dialect: 'postgres',
            protocol: 'postgres',
            native: true,
            logging: false,
        };
        sequelize = new Sequelize(process.env.DATABASE_URL!, dbConfig);

        initializeUser(sequelize);
        initializeBeneficiary(sequelize);
        initializeCommunity(sequelize);
        initializeAppUserThroughTrust(sequelize);
        initializeAppUserTrust(sequelize);
        initializeUbiCommunitySuspect(sequelize);

        // used to query from the beneficiary with incude
        sequelize.models.Beneficiary.belongsTo(sequelize.models.UserModel, {
            foreignKey: 'address',
            as: 'user',
        });
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
        // used to query from the community with incude
        sequelize.models.Community.hasMany(sequelize.models.Beneficiary, {
            foreignKey: 'communityId',
            sourceKey: 'publicId',
            as: 'beneficiaries',
        });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

        const communities = await sequelize.models.Community.bulkCreate([
            {
                // previous suspicious activity removed
                publicId: 'dd70a786-a2af-4c50-8d9c-6472bdb3dfdb',
                requestByAddress: '0x012D33893983E187814Be1bdBe9852299829C554',
                contractAddress: '0x602B9a3a16ad1Ce9a20878a28e3B1eD92D8eDb32',
                name: '',
                description: '',
                city: '',
                country: '',
                gps: { latitude: 0, longitude: 0 },
                email: '',
                visibility: 'public',
                coverImage: '',
                coverMediaId: 0,
                status: 'valid',
                createdAt: new Date(),
                updatedAt: new Date(),
                currency: '',
                descriptionEn: null,
                language: '',
                started: twoMonthsAgo,
            },
            {
                // no suspicious activity
                publicId: '073ddf28-4a3d-4e05-8570-ff38b656b46f',
                requestByAddress: '0x002D33893983E187814Be1bdBe9852299829C554',
                contractAddress: '0x592B9a3a16ad1Ce9a20878a28e3B1eD92D8eDb32',
                name: '',
                description: '',
                city: '',
                country: '',
                gps: { latitude: 0, longitude: 0 },
                email: '',
                visibility: 'public',
                coverImage: '',
                coverMediaId: 0,
                status: 'valid',
                createdAt: new Date(),
                updatedAt: new Date(),
                currency: '',
                descriptionEn: null,
                language: '',
                started: twoMonthsAgo,
            },
            {
                // suspicious activity
                publicId: '173ddf28-4a3d-4e05-8570-ff38b656b46f',
                requestByAddress: '0x102D33893983E187814Be1bdBe9852299829C554',
                contractAddress: '0x692B9a3a16ad1Ce9a20878a28e3B1eD92D8eDb32',
                name: '',
                description: '',
                city: '',
                country: '',
                gps: { latitude: 0, longitude: 0 },
                email: '',
                visibility: 'public',
                coverImage: '',
                coverMediaId: 0,
                status: 'valid',
                createdAt: new Date(),
                updatedAt: new Date(),
                currency: '',
                descriptionEn: null,
                language: '',
                started: twoMonthsAgo,
            },
        ]);

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
            {
                address: '0xb55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x202D33893983E187814Be1bdBe9852299829C554',
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
                suspect: true,
            },
            {
                phone: '00351969696966',
                verifiedPhoneNumber: false,
                suspect: true,
            },
            {
                phone: '00351969696967',
                verifiedPhoneNumber: false,
                suspect: false,
            },
            {
                phone: '00351969696968',
                verifiedPhoneNumber: false,
                suspect: false,
            },
            {
                phone: '00351969696969',
                verifiedPhoneNumber: false,
                suspect: false,
            },
            {
                phone: '00351979696966',
                verifiedPhoneNumber: false,
                suspect: true,
            },
            {
                phone: '00351989696966',
                verifiedPhoneNumber: false,
                suspect: false,
            },
        ]);
        const tIds = r.map((ids) => ids.toJSON());

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
                userAddress: '0xb55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                appUserTrustId: tIds[5].id,
            },
            {
                userAddress: '0x202D33893983E187814Be1bdBe9852299829C554',
                appUserTrustId: tIds[6].id,
            },
        ]);

        await sequelize.models.Beneficiary.bulkCreate([
            {
                address: '0xb55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                communityId: 'dd70a786-a2af-4c50-8d9c-6472bdb3dfdb',
                txAt: new Date(),
                claims: 3,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: false,
                blocked: false,
                tx: '0xa56148b8a8c559bc52e438a8d50afc5c1f68201a07c6c67615d1e2da00999f5b',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x202D33893983E187814Be1bdBe9852299829C554',
                communityId: 'dd70a786-a2af-4c50-8d9c-6472bdb3dfdb',
                txAt: new Date(),
                claims: 2,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: true,
                blocked: false,
                tx: '0xaf364783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                communityId: '073ddf28-4a3d-4e05-8570-ff38b656b46f',
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: true,
                blocked: false,
                tx: '0xb56148b8a8c559bc52e438a8d50afc5c1f68201a07c6c67615d1e2da00999f5b',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                communityId: '073ddf28-4a3d-4e05-8570-ff38b656b46f',
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: false,
                blocked: false,
                tx: '0xef364783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x012D33893983E187814Be1bdBe9852299829C554',
                communityId: '073ddf28-4a3d-4e05-8570-ff38b656b46f',
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: true,
                blocked: false,
                tx: '0xef464783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0xc55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                communityId: '173ddf28-4a3d-4e05-8570-ff38b656b46f',
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: true,
                blocked: false,
                tx: '0xc56148b8a8c559bc52e438a8d50afc5c1f68201a07c6c67615d1e2da00999f5b',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x102D33893983E187814Be1bdBe9852299829C554',
                communityId: '173ddf28-4a3d-4e05-8570-ff38b656b46f',
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: false,
                blocked: false,
                tx: '0xcf364783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const rCommunities = communities.map((ids) => ids.toJSON());

        await sequelize.models.UbiCommunitySuspectModel.bulkCreate([
            {
                communityId: rCommunities[0].id,
                percentage: 50,
                suspect: 10,
                createdAt: yesterday,
            },
        ]);
    });

    after(async () => {
        await sequelize.models.Beneficiary.destroy({
            where: {},
        });
        await sequelize.models.AppUserThroughTrustModel.destroy({
            where: {},
        });
        await sequelize.models.AppUserTrustModel.destroy({
            where: {},
        });
        await sequelize.models.UserModel.destroy({
            where: {},
        });
        await sequelize.models.Community.destroy({
            where: {},
        });
    });

    it('with suspicious activity', async () => {
        const ubiCommunitySuspectAddStub = stub(
            models.ubiCommunitySuspect,
            'create'
        );
        ubiCommunitySuspectAddStub.returns(Promise.resolve({} as any));
        await verifyCommunitySuspectActivity();
        assert.callCount(ubiCommunitySuspectAddStub, 1);
        assert.calledWith(
            ubiCommunitySuspectAddStub.getCall(0),
            {
                communityId: match.any,
                percentage: 50,
                suspect: 10,
            },
            { returning: false }
        );
    });
});
