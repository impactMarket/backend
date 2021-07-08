import { Sequelize } from 'sequelize';
import { stub, assert, match } from 'sinon';
import tk from 'timekeeper';

import { models } from '../../../../src/database';
import { BeneficiaryAttributes } from '../../../../src/database/models/ubi/beneficiary';
import { CommunityAttributes } from '../../../../src/database/models/ubi/community';
import { calcuateCommunitiesMetrics } from '../../../../src/worker/jobs/cron/community';
import { calcuateGlobalMetrics } from '../../../../src/worker/jobs/cron/global';
import BeneficiaryFactory from '../../../factories/beneficiary';
import BeneficiaryTransactionFactory from '../../../factories/beneficiaryTransaction';
import ClaimFactory from '../../../factories/claim';
import CommunityFactory from '../../../factories/community';
import InflowFactory from '../../../factories/inflow';
import UserFactory from '../../../factories/user';
import truncate, { sequelizeSetup } from '../../../utils/sequelizeSetup';
import { jumpToTomorrowMidnight } from '../../../utils/utils';

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
        await truncate(sequelize, 'ReachedAddress');
        await globalDailyStateCreate.reset();
    });

    after(async () => {
        await globalDailyStateCreate.restore();
    });

    it('first day, one community', async () => {
        // THIS IS HAPPENNING TODAY
        tk.travel(jumpToTomorrowMidnight());
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
        tk.travel(jumpToTomorrowMidnight());
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
        tk.travel(jumpToTomorrowMidnight());
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
        tk.travel(jumpToTomorrowMidnight());
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
        tk.travel(jumpToTomorrowMidnight());
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
        tk.travel(jumpToTomorrowMidnight());
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
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        assert.callCount(globalDailyStateCreate, 1);
        assert.calledWith(globalDailyStateCreate.getCall(0), {
            date: match.any,
            avgMedianSSI: 0,
            claimed: '2000000000000000000',
            claims: 2,
            beneficiaries: 0,
            raised: '5000000000000000000',
            backers: 8,
            volume: '1500000000000000000',
            transactions: 2,
            reach: 2,
            reachOut: 1,
            totalRaised: '5000000000000000000',
            totalDistributed: '14000000000000000000',
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

    it('five days, two communities', async () => {
        // THIS IS HAPPENNING TODAY
        tk.travel(jumpToTomorrowMidnight());
        const users = await UserFactory({ n: 6 }); // 2 to one, 3 to other, 1 not beneficiary neither manager
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
            {
                requestByAddress: users[2].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: '750000000000000000',
                    communityId: 0,
                    incrementInterval: 10 * 60,
                    maxClaim: '300000000000000000000',
                },
                hasAddress: true,
            },
        ]);
        const community1 = {
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
        const community2 = {
            ...communities[1],
            contract: {
                baseInterval: 60 * 60 * 24,
                claimAmount: '750000000000000000',
                communityId: 0,
                incrementInterval: 10 * 60,
                maxClaim: '300000000000000000000',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        };
        let beneficiaries: BeneficiaryAttributes[] = [];
        // community 1
        await InflowFactory(community1);
        await InflowFactory(community1);
        await InflowFactory(community1);
        beneficiaries = beneficiaries.concat(
            await BeneficiaryFactory(users.slice(0, 2), community1.publicId)
        );
        await ClaimFactory(beneficiaries[0], community1);
        await ClaimFactory(beneficiaries[1], community1);
        // community 2
        await InflowFactory(community2);
        await InflowFactory(community2);
        await InflowFactory(community2);
        beneficiaries = beneficiaries.concat(
            await BeneficiaryFactory(users.slice(2, 5), community2.publicId)
        );
        await ClaimFactory(beneficiaries[2], community2);
        await ClaimFactory(beneficiaries[3], community2);
        await ClaimFactory(beneficiaries[4], community2);

        // THIS IS HAPPENING TOMORROW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        // community 1
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community1);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });
        // community 2
        await InflowFactory(community2);
        await ClaimFactory(beneficiaries[2], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[4], community2);
        await BeneficiaryTransactionFactory(beneficiaries[2], true, {
            amount: '70000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[3], true, {
            toBeneficiary: beneficiaries[4],
            amount: '500000000000000000',
        });

        // THIS IS HAPPENING TWO DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        // community 1
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community1);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });
        // community 2
        await InflowFactory(community2);
        await ClaimFactory(beneficiaries[2], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[4], community2);
        await BeneficiaryTransactionFactory(beneficiaries[2], true, {
            amount: '40000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[4], true, {
            toBeneficiary: beneficiaries[1],
            amount: '200000000000000000',
        });

        // THIS IS HAPPENING THREE DAYS FROM NOW
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000);
        await calcuateCommunitiesMetrics();
        // community 1
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community1);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });
        // community 2
        await InflowFactory(community2);
        await ClaimFactory(beneficiaries[2], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 4);
        await ClaimFactory(beneficiaries[4], community2);
        await BeneficiaryTransactionFactory(beneficiaries[3], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[4], true, {
            toBeneficiary: beneficiaries[3],
            amount: '1000000000000000000',
        });

        // THIS IS HAPPENING FOUR DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        // community 1
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community1);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });
        // community 2
        await InflowFactory(community2);
        await ClaimFactory(beneficiaries[2], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[3], community2);
        // no claim, on purpose
        // tk.travel(new Date().getTime() + 1000 * 60 * 4);
        // await ClaimFactory(beneficiaries[3], community2);
        await BeneficiaryTransactionFactory(beneficiaries[2], true, {
            amount: '50000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[3], true, {
            toBeneficiary: beneficiaries[4],
            amount: '100000000000000000',
        });

        // THIS IS HAPPENING FIVE DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        // community 1
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[1], community1);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });
        // community 2
        await InflowFactory(community2);
        await ClaimFactory(beneficiaries[2], community2);
        // no claim, on purpose
        // tk.travel(new Date().getTime() + 1000 * 60 * 3);
        // await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 3);
        await ClaimFactory(beneficiaries[4], community2);
        await BeneficiaryTransactionFactory(beneficiaries[2], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[4], true, {
            toBeneficiary: beneficiaries[2],
            amount: '1000000000000000000',
        });

        // THIS IS HAPPENING SIX DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        assert.callCount(globalDailyStateCreate, 1);
        assert.calledWith(globalDailyStateCreate.getCall(0), {
            date: match.any,
            avgMedianSSI: 0,
            claimed: '3500000000000000000',
            claims: 4,
            beneficiaries: 0,
            raised: '8750000000000000000',
            backers: 16,
            volume: '1650000000000000000',
            transactions: 4,
            reach: 4,
            reachOut: 2,
            totalRaised: '8750000000000000000',
            totalDistributed: '27500000000000000000',
            totalBackers: 16,
            totalBeneficiaries: 5,
            givingRate: 0.14,
            ubiRate: 0,
            fundingRate: 65.71,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 0,
            totalVolume: '1650000000000000000',
            totalTransactions: BigInt(4),
            totalReach: BigInt(4),
            totalReachOut: BigInt(2),
        });
        globalDailyStateCreate.reset();

        // community 1
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 8);
        await ClaimFactory(beneficiaries[1], community1);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
            amount: '1000000000000000000',
        });
        // community 2
        await InflowFactory(community2);
        await ClaimFactory(beneficiaries[2], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 5);
        await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 12);
        await ClaimFactory(beneficiaries[4], community2);
        await BeneficiaryTransactionFactory(beneficiaries[2], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[4], true, {
            toBeneficiary: beneficiaries[2],
            amount: '1000000000000000000',
        });

        // THIS IS HAPPENING SEVEN DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        assert.callCount(globalDailyStateCreate, 1);
        assert.calledWith(globalDailyStateCreate.getCall(0), {
            date: match.any,
            avgMedianSSI: 0,
            claimed: '4250000000000000000',
            claims: 5,
            beneficiaries: 0,
            raised: '8750000000000000000',
            backers: 18,
            volume: '3000000000000000000',
            transactions: 4,
            reach: 4,
            reachOut: 2,
            totalRaised: '8750000000000000000',
            totalDistributed: '32500000000000000000',
            totalBackers: 18,
            totalBeneficiaries: 5,
            givingRate: 0.14,
            ubiRate: 0.84,
            fundingRate: 64.12,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 14.96,
            totalVolume: '3000000000000000000',
            totalTransactions: BigInt(4),
            totalReach: BigInt(7),
            totalReachOut: BigInt(4),
        });
    });
});
