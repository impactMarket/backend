import { stub, assert, match } from 'sinon';
import { Sequelize } from 'sequelize';

import { initializeUser } from '../../../../src/database/models/app/user';
import { initializeReachedAddress } from '../../../../src/database/models/reachedAddress';
import { initializeBeneficiary } from '../../../../src/database/models/ubi/beneficiary';
import { initializeCommunity } from '../../../../src/database/models/ubi/community';
import { initializeAppUserTrust } from '../../../../src/database/models/app/appUserTrust';
import { initializeAppUserThroughTrust } from '../../../../src/database/models/app/appUserThroughTrust';
import { verifyCommunitySuspectActivity } from '../../../../src/worker/jobs/cron/community';

describe('[jobs - cron] verifyCommunitySuspectActivity', () => {
    let sequelize;
    before(async () => {
        const dbConfig: any = {
            dialect: 'postgres',
            protocol: 'postgres',
            native: true,
            logging: false,
        };
        sequelize = new Sequelize(
            'postgresql://postgres:mysecretpassword@localhost/impactmarkettest',
            dbConfig
        );

        initializeUser(sequelize);
        initializeBeneficiary(sequelize);
        initializeCommunity(sequelize);
        initializeAppUserThroughTrust(sequelize);
        initializeAppUserTrust(sequelize);

        // used to query from the user with incude
        sequelize.models.UserModel.hasMany(sequelize.models.Beneficiary, {
            foreignKey: 'address',
            as: 'beneficiary',
        });
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
        // self association to find repeated values on those keys
        sequelize.models.AppUserTrustModel.hasMany(
            sequelize.models.AppUserTrustModel,
            {
                foreignKey: 'phone',
                sourceKey: 'phone',
                as: 'selfTrust',
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

        await sequelize.models.Community.bulkCreate([
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
                logo: '',
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
                logo: '',
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
                suspect: false,
            },
        ]);
        console.log(r);

        await sequelize.models.AppUserThroughTrustModel.bulkCreate([
            {
                userAddress: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                appUserTrustId: 1,
            },
            {
                userAddress: '0x002D33893983E187814Be1bdBe9852299829C554',
                appUserTrustId: 2,
            },
            {
                userAddress: '0xc55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                appUserTrustId: 3,
            },
            {
                userAddress: '0x102D33893983E187814Be1bdBe9852299829C554',
                appUserTrustId: 4,
            },
        ]);

        await sequelize.models.Beneficiary.bulkCreate([
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                communityId: '073ddf28-4a3d-4e05-8570-ff38b656b46f',
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: true,
                blocked: false,
                tx:
                    '0xb56148b8a8c559bc52e438a8d50afc5c1f68201a07c6c67615d1e2da00999f5b',
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
                tx:
                    '0xef364783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
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
                tx:
                    '0xc56148b8a8c559bc52e438a8d50afc5c1f68201a07c6c67615d1e2da00999f5b',
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
                tx:
                    '0xcf364783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
                createdAt: new Date(),
                updatedAt: new Date(),
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
        console.log('1');
        await verifyCommunitySuspectActivity();
        console.log('2');
    });
});
