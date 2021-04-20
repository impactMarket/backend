import { Sequelize } from 'sequelize';
import { assert, match } from 'sinon';
import initModels from '../../../../src/database/models';

import { initializeUser } from '../../../../src/database/models/app/user';
import { initializeBeneficiary } from '../../../../src/database/models/ubi/beneficiary';
import { initializeCommunity } from '../../../../src/database/models/ubi/community';
import { initializeUbiCommunityDailyState } from '../../../../src/database/models/ubi/communityDailyState';
import { User } from '../../../../src/interfaces/app/user';
import { calcuateCommunitiesMetrics } from '../../../../src/worker/jobs/cron/community';
import {
    validNonEmptyMonthLongCommunities,
    validNonEmptyLessThanMonthLongCommunities,
    validEmptyCommunities,
} from '../../../fake/community';

describe('INTEGRATION [jobs - cron] calcuateCommunitiesMetrics2', () => {
    let sequelize;
    before(async () => {
        const dbConfig: any = {
            dialect: 'postgres',
            protocol: 'postgres',
            native: true,
            logging: false,
        };
        sequelize = new Sequelize(process.env.DATABASE_URL!, dbConfig);

        console.log('x1');

        initModels(sequelize);

        console.log('x2');
        // initializeUser(sequelize);
        // initializeBeneficiary(sequelize);
        // initializeCommunity(sequelize);
        // initializeUbiCommunityDailyState(sequelize);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

        const userResults = await sequelize.models.UserModel.bulkCreate([
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
            },
        ]);

        const users = userResults.map((c) => c.toJSON() as User);

        console.log('x3');
        const communityPublicId = '073ddf28-4a3d-4e05-8570-ff38b656b46f';
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
        const communitiesResult = await sequelize.models.Community.bulkCreate([
            {
                publicId: communityPublicId,
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
                currency: '',
                language: '',
                started: twoMonthsAgo,
            },
        ]);
        const communities = communitiesResult.map((c) => c.toJSON());

        await sequelize.models.UbiCommunityContractModel.bulkCreate([
            {
                communityId: communities[0].id,
                claimAmount: '1000000000000000000',
                maxClaim: '12000000000000000000',
                baseInterval: 86400,
                incrementInterval: 60,
            },
        ]);

        await sequelize.models.UbiCommunityStateModel.bulkCreate([
            {
                communityId: communities[0].id,
            },
        ]);

        await sequelize.models.Inflow.create({
            communityId: communityPublicId,
            amount: '15000000000000000000',
            from: '0x5',
            tx: '0x6',
            txAt: fourDaysAgo,
        });

        // await sequelize.models.UbiCommunityDailyMetricsModel.bulkCreate([
        //     {
        //         communityId: communities[0].id,
        //         ssiDayAlone: 1.6,
        //         ssi: 1.6,
        //         ubiRate: '0.55',
        //         estimatedDuration: '6',
        //         date: new Date(),
        //     },
        //     {
        //         communityId: communities[0].id,
        //         ssiDayAlone: 1.8,
        //         ssi: 1.7,
        //         ubiRate: '0.55',
        //         estimatedDuration: '6',
        //         date: new Date(),
        //     },
        // ]);

        console.log('x5');
        await sequelize.models.Beneficiary.bulkCreate([
            {
                address: users[0].address,
                communityId: communityPublicId,
                txAt: new Date(),
                tx:
                    '0xb56148b8a8c559bc52e438a8d50afc5c1f68201a07c6c67615d1e2da00999f5b',
            },
            {
                address: users[1].address,
                communityId: communityPublicId,
                txAt: new Date(),
                tx:
                    '0xef364783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
            },
        ]);

        await sequelize.models.Claim.bulkCreate([
            {
                address: users[0].address,
                communityId: communityPublicId,
                amount: '1000000000000000000',
                tx: '0x7',
                txAt: fourDaysAgo,
            },
            {
                address: users[1].address,
                communityId: communityPublicId,
                amount: '1000000000000000000',
                tx: '0x8',
                txAt: fourDaysAgo,
            },
            {
                address: users[0].address,
                communityId: communityPublicId,
                amount: '1000000000000000000',
                tx: '0x9',
                txAt: new Date(fourDaysAgo.getTime() + 86400),
            },
            {
                address: users[1].address,
                communityId: communityPublicId,
                amount: '1000000000000000000',
                tx: '0x10',
                txAt: new Date(fourDaysAgo.getTime() + 86400),
            },
            {
                address: users[0].address,
                communityId: communityPublicId,
                amount: '1000000000000000000',
                tx: '0x9',
                txAt: new Date(fourDaysAgo.getTime() + 86400 * 2 + 60 + 5 * 60),
            },
            {
                address: users[1].address,
                communityId: communityPublicId,
                amount: '1000000000000000000',
                tx: '0x10',
                txAt: new Date(fourDaysAgo.getTime() + 86400 * 2 + 60 + 3 * 60),
            },
        ]);

        console.log('x6');

        // await sequelize.models.UbiCommunityDailyStateModel.bulkCreate([
        //     {
        //         communityId: communities[0].id,
        //         claimed: '12000000000000000000',
        //         claims: 2,
        //         beneficiaries: 2,
        //         raised: '13000000000000000000',
        //         backers: 1,
        //         volume: '0',
        //         transactions: 0,
        //         reach: 0,
        //         reachOut: 0,
        //         ubiRate: 1,
        //         fundingRate: '13000000000000000000',
        //         date: yesterday,
        //         createdAt: new Date(),
        //         updatedAt: new Date(),
        //     },
        //     {
        //         communityId: communities[0].id,
        //         claimed: '12000000000000000000',
        //         claims: 2,
        //         beneficiaries: 2,
        //         raised: '13000000000000000000',
        //         backers: 1,
        //         volume: '0',
        //         transactions: 0,
        //         reach: 0,
        //         reachOut: 0,
        //         ubiRate: 1,
        //         fundingRate: '13000000000000000000',
        //         date: new Date(),
        //         createdAt: new Date(),
        //         updatedAt: new Date(),
        //     },
        // ]);
    });

    after(async () => {
        await sequelize.models.Beneficiary.destroy({
            where: {},
        });
        await sequelize.models.UserModel.destroy({
            where: {},
        });
        await sequelize.models.UbiCommunityDailyStateModel.destroy({
            where: {},
        });
        await sequelize.models.UbiCommunityDailyMetricsModel.destroy({
            where: {},
        });
        await sequelize.models.Community.destroy({
            where: {},
        });
    });

    it('all valid, non-empty communities, <30 days', async () => {
        // run!
        await calcuateCommunitiesMetrics();
    });
});
