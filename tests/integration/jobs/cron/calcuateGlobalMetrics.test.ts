import { expect } from 'chai';
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
        // this two has to come first!
        await truncate(sequelize, 'Manager');
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize);
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

    it('four days, two communities', async () => {
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
            avgUbiDuration: 17.55,
            totalVolume: '14460000000000000000',
            totalTransactions: BigInt(24),
            totalReach: BigInt(4),
            totalReachOut: BigInt(2),
        });
        await globalDailyStateCreate.resetHistory();

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
        await globalDailyStateCreate.resetHistory();

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
        await globalDailyStateCreate.resetHistory();

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
            avgUbiDuration: 16.52,
            totalVolume: '23460000000000000000',
            totalTransactions: BigInt(36),
            totalReach: BigInt(10),
            totalReachOut: BigInt(8),
        });
    });

    it('four days, four communities, one intermitente activity, one inactive', async () => {
        // THIS IS HAPPENNING TODAY
        tk.travel(jumpToTomorrowMidnight());
        const users = await UserFactory({ n: 40 }); // 10 fo each community
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
                requestByAddress: users[10].address,
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
            {
                requestByAddress: users[20].address,
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
                requestByAddress: users[30].address,
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
        const community3 = {
            ...communities[2],
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
        const community4 = {
            ...communities[3],
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
            await BeneficiaryFactory(users.slice(10, 13), community2.publicId)
        );
        await ClaimFactory(beneficiaries[2], community2);
        await ClaimFactory(beneficiaries[3], community2);
        await ClaimFactory(beneficiaries[4], community2);
        // community 3
        await InflowFactory(community3);
        await InflowFactory(community3);
        await InflowFactory(community3);
        beneficiaries = beneficiaries.concat(
            await BeneficiaryFactory(users.slice(20, 24), community3.publicId)
        );
        await ClaimFactory(beneficiaries[5], community3);
        await ClaimFactory(beneficiaries[6], community3);
        await ClaimFactory(beneficiaries[7], community3);
        await ClaimFactory(beneficiaries[8], community3);
        // community 4
        await InflowFactory(community4);
        await InflowFactory(community4);
        await InflowFactory(community4);
        beneficiaries = beneficiaries.concat(
            await BeneficiaryFactory(users.slice(30, 34), community4.publicId)
        );
        await ClaimFactory(beneficiaries[9], community4);
        await ClaimFactory(beneficiaries[10], community4);
        await ClaimFactory(beneficiaries[11], community4);
        await ClaimFactory(beneficiaries[12], community4);

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
        // community 3
        await InflowFactory(community3);
        await ClaimFactory(beneficiaries[5], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
        await ClaimFactory(beneficiaries[6], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[7], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[8], community3);
        await BeneficiaryTransactionFactory(beneficiaries[5], true, {
            amount: '70000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[6], true, {
            toBeneficiary: beneficiaries[7],
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
        // community 3
        await InflowFactory(community3);
        await ClaimFactory(beneficiaries[5], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 12);
        await ClaimFactory(beneficiaries[6], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[7], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 2);
        // await ClaimFactory(beneficiaries[8], community3);
        await BeneficiaryTransactionFactory(beneficiaries[8], true, {
            amount: '70000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[6], true, {
            toBeneficiary: beneficiaries[5],
            amount: '500000000000000000',
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
        // community 3
        await InflowFactory(community3);
        await ClaimFactory(beneficiaries[5], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 15);
        await ClaimFactory(beneficiaries[6], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 2);
        // await ClaimFactory(beneficiaries[7], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[8], community3);
        await BeneficiaryTransactionFactory(beneficiaries[5], true, {
            amount: '70000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[6], true, {
            toBeneficiary: beneficiaries[7],
            amount: '500000000000000000',
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
        // community 3
        await InflowFactory(community3);
        await ClaimFactory(beneficiaries[5], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
        await ClaimFactory(beneficiaries[6], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[7], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[8], community3);
        await BeneficiaryTransactionFactory(beneficiaries[5], true, {
            amount: '70000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[6], true, {
            toBeneficiary: beneficiaries[7],
            amount: '500000000000000000',
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
        // community 3
        await InflowFactory(community3);
        // await ClaimFactory(beneficiaries[5], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 60 * 9);
        // await ClaimFactory(beneficiaries[6], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 2);
        // await ClaimFactory(beneficiaries[7], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 2);
        // await ClaimFactory(beneficiaries[8], community3);
        await BeneficiaryTransactionFactory(beneficiaries[5], true, {
            amount: '70000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[6], true, {
            toBeneficiary: beneficiaries[7],
            amount: '500000000000000000',
        });

        // THIS IS HAPPENING SIX DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        // community 1
        await InflowFactory(community1);
        await ClaimFactory(beneficiaries[0], community1);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 2);
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
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 2);
        await ClaimFactory(beneficiaries[4], community2);
        await BeneficiaryTransactionFactory(beneficiaries[2], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[4], true, {
            toBeneficiary: beneficiaries[2],
            amount: '1000000000000000000',
        });
        // community 3
        beneficiaries = beneficiaries.concat(
            await BeneficiaryFactory(users.slice(24, 26), community3.publicId)
        );
        await InflowFactory(community3);
        await ClaimFactory(beneficiaries[5], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 60 * 2);
        await ClaimFactory(beneficiaries[6], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[7], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[8], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[13], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[14], community3);
        await BeneficiaryTransactionFactory(beneficiaries[5], true, {
            amount: '70000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[6], true, {
            toBeneficiary: beneficiaries[7],
            amount: '500000000000000000',
        });

        // THIS IS HAPPENING SEVEN DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        assert.callCount(globalDailyStateCreate, 1);
        assert.calledWith(globalDailyStateCreate.getCall(0), {
            date: match.any,
            avgMedianSSI: 36.27,
            claimed: '9500000000000000000',
            claims: 10,
            beneficiaries: 2,
            raised: '13750000000000000000',
            backers: 30,
            volume: '3570000000000000000',
            transactions: 6,
            reach: 6,
            reachOut: 3,
            totalRaised: '13750000000000000000',
            totalDistributed: '54500000000000000000',
            totalBackers: 30,
            totalBeneficiaries: 15,
            givingRate: 0.15,
            ubiRate: 0.47,
            fundingRate: 59.62,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 28.74,
            totalVolume: '17880000000000000000',
            totalTransactions: BigInt(36),
            totalReach: BigInt(6),
            totalReachOut: BigInt(3),
        });
        await globalDailyStateCreate.resetHistory();

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
        // community 3
        await InflowFactory(community3);
        // await ClaimFactory(beneficiaries[5], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 60 * 2);
        // await ClaimFactory(beneficiaries[6], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 2);
        // await ClaimFactory(beneficiaries[7], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 2);
        // await ClaimFactory(beneficiaries[8], community3);
        // await BeneficiaryTransactionFactory(beneficiaries[5], true, {
        //     amount: '70000000000000000',
        // });
        // await BeneficiaryTransactionFactory(beneficiaries[6], true, {
        //     toBeneficiary: beneficiaries[7],
        //     amount: '500000000000000000',
        // });

        // THIS IS HAPPENING SEVEN DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        assert.callCount(globalDailyStateCreate, 1);
        assert.calledWith(globalDailyStateCreate.getCall(0), {
            date: match.any,
            avgMedianSSI: 36.57,
            claimed: '4250000000000000000',
            claims: 5,
            beneficiaries: 0,
            raised: '13750000000000000000',
            backers: 33,
            volume: '3000000000000000000',
            transactions: 4,
            reach: 4,
            reachOut: 2,
            totalRaised: '27500000000000000000',
            totalDistributed: '58750000000000000000',
            totalBackers: 33,
            totalBeneficiaries: 15,
            givingRate: 0.15,
            ubiRate: 0.48,
            fundingRate: 60.5,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 28.43,
            totalVolume: '20880000000000000000',
            totalTransactions: BigInt(40),
            totalReach: BigInt(8),
            totalReachOut: BigInt(5),
        });
        await globalDailyStateCreate.resetHistory();

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
        // community 3
        // await InflowFactory(community3);
        // await ClaimFactory(beneficiaries[5], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 60 * 2);
        // await ClaimFactory(beneficiaries[6], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 2);
        // await ClaimFactory(beneficiaries[7], community3);
        // tk.travel(new Date().getTime() + 1000 * 60 * 2);
        // await ClaimFactory(beneficiaries[8], community3);
        // await BeneficiaryTransactionFactory(beneficiaries[5], true, {
        //     amount: '70000000000000000',
        // });
        // await BeneficiaryTransactionFactory(beneficiaries[6], true, {
        //     toBeneficiary: beneficiaries[7],
        //     amount: '500000000000000000',
        // });

        // THIS IS HAPPENING SEVEN DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        assert.callCount(globalDailyStateCreate, 1);
        assert.calledWith(globalDailyStateCreate.getCall(0), {
            date: match.any,
            avgMedianSSI: 35.71,
            claimed: '6250000000000000000',
            claims: 7,
            beneficiaries: 2,
            raised: '8750000000000000000',
            backers: 35,
            volume: '3000000000000000000',
            transactions: 4,
            reach: 4,
            reachOut: 2,
            totalRaised: '36250000000000000000',
            totalDistributed: '65000000000000000000',
            totalBackers: 35,
            totalBeneficiaries: 17,
            givingRate: 0.15,
            ubiRate: 0.49,
            fundingRate: 58.73,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 27.65,
            totalVolume: '23880000000000000000',
            totalTransactions: BigInt(44),
            totalReach: BigInt(10),
            totalReachOut: BigInt(7),
        });
        await globalDailyStateCreate.resetHistory();

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
            await BeneficiaryFactory([users[14]], community2.publicId)
        );
        await InflowFactory(community2);
        await ClaimFactory(beneficiaries[2], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 5);
        await ClaimFactory(beneficiaries[3], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 12);
        await ClaimFactory(beneficiaries[4], community2);
        tk.travel(new Date().getTime() + 1000 * 60 * 12);
        await ClaimFactory(beneficiaries[15], community2);
        await BeneficiaryTransactionFactory(beneficiaries[2], true, {
            amount: '500000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[4], true, {
            toBeneficiary: beneficiaries[2],
            amount: '1000000000000000000',
        });
        // community 3
        await InflowFactory(community3);
        await ClaimFactory(beneficiaries[5], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 9);
        await ClaimFactory(beneficiaries[6], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[7], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[8], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[13], community3);
        tk.travel(new Date().getTime() + 1000 * 60 * 2);
        await ClaimFactory(beneficiaries[14], community3);
        await BeneficiaryTransactionFactory(beneficiaries[5], true, {
            amount: '70000000000000000',
        });
        await BeneficiaryTransactionFactory(beneficiaries[6], true, {
            toBeneficiary: beneficiaries[7],
            amount: '500000000000000000',
        });

        // THIS IS HAPPENING SEVEN DAYS FROM NOW
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        assert.callCount(globalDailyStateCreate, 1);
        assert.calledWith(globalDailyStateCreate.getCall(0), {
            date: match.any,
            avgMedianSSI: 34.89,
            claimed: '11000000000000000000',
            claims: 12,
            beneficiaries: -1,
            raised: '13750000000000000000',
            backers: 38,
            volume: '3570000000000000000',
            transactions: 6,
            reach: 6,
            reachOut: 3,
            totalRaised: '50000000000000000000',
            totalDistributed: '76000000000000000000',
            totalBackers: 38,
            totalBeneficiaries: 16,
            givingRate: 0.15,
            ubiRate: 0.49,
            fundingRate: 55.62,
            spendingRate: 0,
            avgComulativeUbi: '375000000000000000000',
            avgUbiDuration: 29.26,
            totalVolume: '27450000000000000000',
            totalTransactions: BigInt(50),
            totalReach: BigInt(13),
            totalReachOut: BigInt(10),
        });
    });

    it('calculate global/community metrics after remove a community', async () => {
        const users = await UserFactory({ n: 1 });
        const communities = await CommunityFactory([
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
        const community: any = {
            ...communities[0],
            contract: {
                baseInterval: 60 * 60 * 24,
                claimAmount: '1000000000000000000',
                communityId: 0,
                incrementInterval: 5 * 60,
                maxClaim: '450000000000000000000',
            },
        };

        // next day
        tk.travel(jumpToTomorrowMidnight());
        const beneficiaries = await BeneficiaryFactory(
            users,
            community.publicId
        );
        await InflowFactory(community);
        await ClaimFactory(beneficiaries[0], community);
        await ClaimFactory(beneficiaries[0], community);

        // next day
        tk.travel(jumpToTomorrowMidnight());
        console.log('date => ', new Date)
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();

        const date = new Date();
        date.setDate(date.getDate() - 1);
        const communityBeforeUpdate = await models.ubiCommunityDailyState.findOne({
            where: {
                date,
                communityId: community.id
            }
        });
        const globalBeforeUpdate = await models.globalDailyState.findOne({
            where: {
                date,
            }
        });

        // remove community and beneficiaries
        await models.community.update({
            status: 'removed',
            deletedAt: new Date()
        }, {
            where: {
                publicId: community.publicId
            }
        })
        await models.beneficiary.update({
            active: false
        }, {
            where: {
                communityId: community.publicId
            }
        });

        // next day
        tk.travel(jumpToTomorrowMidnight());
        await calcuateCommunitiesMetrics();
        await calcuateGlobalMetrics();
        const newDate = new Date();
        newDate.setDate(newDate.getDate() - 1);
        const communityAfterUpdate = await models.ubiCommunityDailyState.findOne({
            where: {
                date: newDate,
                communityId: community.id
            }
        });
        const globalAfterUpdate = await models.globalDailyState.findOne({
            where: {
                date: newDate,
            }
        });
        
        expect(communityBeforeUpdate!.beneficiaries).to.be.equal(1);
        expect(communityAfterUpdate!.beneficiaries).to.be.equal(-1);
        expect(globalBeforeUpdate!).to.include({
            beneficiaries: 1,
            totalBeneficiaries: 1
        });
        expect(globalAfterUpdate!).to.include({
            beneficiaries: -1,
            totalBeneficiaries: 0
        });
    });
});
