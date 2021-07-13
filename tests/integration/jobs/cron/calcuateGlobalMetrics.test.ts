import { Sequelize } from 'sequelize';
import { assert, match, spy } from 'sinon';
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

    const globalDailyStateCreate = spy(models.globalDailyState, 'create');
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
        await globalDailyStateCreate.resetHistory();
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        await InflowFactory(community);
        await ClaimFactory(beneficiaries[0], community);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
        await ClaimFactory(beneficiaries[1], community);
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[0], true, {
            toBeneficiary: beneficiaries[1],
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
            claimed: '2000000000000000000',
            claims: 2,
            beneficiaries: 0,
            raised: '5000000000000000000',
            backers: 9, // active last month, it's correct
            volume: '1500000000000000000',
            transactions: 2,
            reach: 2,
            reachOut: 1,
            totalRaised: '5000000000000000000',
            totalDistributed: '14000000000000000000',
            totalBackers: 9,
            totalBeneficiaries: 2,
            givingRate: 0.16,
            ubiRate: 1,
            fundingRate: 68.88,
            spendingRate: 0,
            avgComulativeUbi: '450000000000000000000',
            avgUbiDuration: 15,
            totalVolume: '9000000000000000000',
            totalTransactions: BigInt(12),
            totalReach: BigInt(2), // TODO: 8
            totalReachOut: BigInt(1), // TODO: 6
        });
    });

    it('five days, two communities', async () => {
        // THIS IS HAPPENNING TODAY
        tk.travel(jumpToTomorrowMidnight());
        const users = await UserFactory({ n: 10 }); // 2 to one, 3 to other, 1 not beneficiary neither manager, 4 added later
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
        await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        // tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
        // await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        // community 1
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
        // tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
        // await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
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
            claimed: '3500000000000000000',
            claims: 4,
            beneficiaries: 0,
            raised: '8750000000000000000',
            backers: 18,
            volume: '3000000000000000000',
            transactions: 4,
            reach: 4,
            reachOut: 2,
            totalRaised: '8750000000000000000',
            totalDistributed: '27500000000000000000',
            totalBackers: 18,
            totalBeneficiaries: 5,
            givingRate: 0.14,
            ubiRate: 0.72,
            fundingRate: 65.07,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 17.545,
            totalVolume: '14460000000000000000',
            totalTransactions: BigInt(24),
            totalReach: BigInt(4),
            totalReachOut: BigInt(2),
        });
        globalDailyStateCreate.resetHistory();

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
            backers: 20,
            volume: '3000000000000000000',
            transactions: 4,
            reach: 4,
            reachOut: 2,
            totalRaised: '17500000000000000000',
            totalDistributed: '31750000000000000000',
            totalBackers: 20,
            totalBeneficiaries: 5,
            givingRate: 0.14,
            ubiRate: 0.73,
            fundingRate: 63.71,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 17.14,
            totalVolume: '17460000000000000000',
            totalTransactions: BigInt(28),
            totalReach: BigInt(6),
            totalReachOut: BigInt(4),
        });
        globalDailyStateCreate.resetHistory();

        // community 1
        beneficiaries = beneficiaries.concat(
            await BeneficiaryFactory(users.slice(5, 7), community1.publicId)
        );
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 8);
        await ClaimFactory(beneficiaries[1], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 1);
        await ClaimFactory(beneficiaries[5], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 1);
        await ClaimFactory(beneficiaries[6], community1);
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
            claimed: '6250000000000000000',
            claims: 7,
            beneficiaries: 2,
            raised: '8750000000000000000',
            backers: 22,
            volume: '3000000000000000000',
            transactions: 4,
            reach: 4,
            reachOut: 2,
            totalRaised: '26250000000000000000',
            totalDistributed: '38000000000000000000',
            totalBackers: 22,
            totalBeneficiaries: 7,
            givingRate: 0.14,
            ubiRate: 0.75,
            fundingRate: 60.51,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 16.66,
            totalVolume: '20460000000000000000',
            totalTransactions: BigInt(32),
            totalReach: BigInt(8),
            totalReachOut: BigInt(6),
        });
        globalDailyStateCreate.resetHistory();

        // community 1
        await BeneficiaryFactory(users.slice(5, 7), community1.publicId, true);
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
        beneficiaries = beneficiaries.concat(
            await BeneficiaryFactory([users[7]], community2.publicId)
        );
        await InflowFactory(community2);
        await ClaimFactory(beneficiaries[2], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 5);
        await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 12);
        await ClaimFactory(beneficiaries[4], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 12);
        await ClaimFactory(beneficiaries[7], community2);
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
            claimed: '5000000000000000000',
            claims: 6,
            beneficiaries: -1,
            raised: '8750000000000000000',
            backers: 24,
            volume: '3000000000000000000',
            transactions: 4,
            reach: 4,
            reachOut: 2,
            totalRaised: '35000000000000000000',
            totalDistributed: '43000000000000000000',
            totalBackers: 24,
            totalBeneficiaries: 6,
            givingRate: 0.14,
            ubiRate: 0.76,
            fundingRate: 59.04,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 16.525,
            totalVolume: '23460000000000000000',
            totalTransactions: BigInt(36),
            totalReach: BigInt(10),
            totalReachOut: BigInt(8),
        });
    });
});
