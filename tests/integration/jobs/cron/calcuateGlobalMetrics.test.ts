import { Sequelize } from 'sequelize';
import { stub, assert, match } from 'sinon';
import tk from 'timekeeper';

import { models } from '../../../../src/database';
import { CommunityAttributes } from '../../../../src/database/models/ubi/community';
import { UbiCommunityDailyStateCreation } from '../../../../src/interfaces/ubi/ubiCommunityDailyState';
import { calcuateCommunitiesMetrics } from '../../../../src/worker/jobs/cron/community';
import { calcuateGlobalMetrics } from '../../../../src/worker/jobs/cron/global';
import BeneficiaryFactory from '../../../factories/beneficiary';
import BeneficiaryTransactionFactory from '../../../factories/beneficiaryTransaction';
import ClaimFactory from '../../../factories/claim';
import CommunityFactory from '../../../factories/community';
import UbiCommunityDailyStateFactory from '../../../factories/communityDailyState';
import InflowFactory from '../../../factories/inflow';
import UserFactory from '../../../factories/user';
import truncate, { sequelizeSetup } from '../../../utils/sequelizeSetup';

describe('#calcuateGlobalMetrics()', () => {
    let communities: CommunityAttributes[] = [];
    let sequelize: Sequelize;

    const globalDailyStateCreate = stub(models.globalDailyState, 'create');
    globalDailyStateCreate.returns(Promise.resolve({} as any));
    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
    });

    afterEach(async () => {
        await truncate(sequelize, 'Inflow');
        await truncate(sequelize, 'Claim');
        await truncate(sequelize, 'BeneficiaryTransaction');
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize, 'UserModel');
        await truncate(sequelize, 'Community');
        await truncate(sequelize, 'UbiCommunityDailyStateModel');
        await truncate(sequelize, 'GlobalDailyState');
    });

    it('first day, one community', async () => {
        // THIS IS HAPPENNING TODAY
        const users = await UserFactory({ n: 2 });
        communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: '1000000000000000000',
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim: '450000000000000000000',
                },
                hasAddress: true,
            },
        ]);
        const community = {
            ...communities[0],
            contract: {
                baseInterval: 60 * 60 * 24,
                claimAmount: '1000000000000000000',
                communityId: 0,
                incrementInterval: 5 * 60,
                maxClaim: '450000000000000000000',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        };
        const day = new Date();
        day.setDate(day.getDate() - 1);
        const days: UbiCommunityDailyStateCreation[] = [];
        for (let index = 0; index < 7; index++) {
            days.push({ communityId: communities[0].id, date: new Date(day) });
            day.setDate(day.getDate() + 1);
        }
        await UbiCommunityDailyStateFactory(days);
        await InflowFactory(community);
        await InflowFactory(community);
        await InflowFactory(community);
        const beneficiaries = await BeneficiaryFactory(
            users,
            community.publicId
        );
        await ClaimFactory(beneficiaries[0], community);
        await ClaimFactory(beneficiaries[1], community);

        // THIS IS HAPPENING TOMORROW
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000);
        await calcuateCommunitiesMetrics();
        await InflowFactory(community);
        await ClaimFactory(beneficiaries[0], community);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });

        // THIS IS HAPPENING TWO DAYS FROM NOW
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000);
        await calcuateCommunitiesMetrics();
        await InflowFactory(community);
        await ClaimFactory(beneficiaries[0], community);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });

        // THIS IS HAPPENING THREE DAYS FROM NOW
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000);
        await calcuateCommunitiesMetrics();
        await InflowFactory(community);
        await ClaimFactory(beneficiaries[0], community);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });

        // THIS IS HAPPENING FOUR DAYS FROM NOW
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000);
        await calcuateCommunitiesMetrics();
        await InflowFactory(community);
        await ClaimFactory(beneficiaries[0], community);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });

        // THIS IS HAPPENING FIVE DAYS FROM NOW
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000);
        await calcuateCommunitiesMetrics();
        await InflowFactory(community);
        await ClaimFactory(beneficiaries[0], community);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });

        // THIS IS HAPPENING SIX DAYS FROM NOW
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 24 + 36 * 60 * 1000);
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        assert.callCount(globalDailyStateCreate, 1);
        assert.calledWith(globalDailyStateCreate.getCall(0), {
            date: match.any,
            avgMedianSSI: 0,
            claimed: '2000000000000000000',
            claims: 2,
            beneficiaries: 2,
            raised: '5000000000000000000',
            backers: 8,
            volume: '1500000000000000000',
            transactions: 2,
            reach: 2,
            reachOut: 1,
            totalRaised: '5000000000000000000',
            totalDistributed: '13000000000000000000',
            totalBackers: 8,
            totalBeneficiaries: 2,
            givingRate: 0.16,
            ubiRate: 0.85,
            fundingRate: 70,
            spendingRate: 0,
            avgComulativeUbi: '450000000000000000000',
            avgUbiDuration: 17.64,
            totalVolume: '1500000000000000000',
            totalTransactions: BigInt(2),
            totalReach: BigInt(2),
            totalReachOut: BigInt(1),
        });
    });
});
