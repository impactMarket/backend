import { CreateOptions, Model, Sequelize } from 'sequelize';
import Sinon, { assert, match, spy } from 'sinon';
import tk from 'timekeeper';

import { models } from '../../../../src/database';
import { AppUser } from '../../../../src/interfaces/app/appUser';
import { BeneficiaryAttributes } from '../../../../src/interfaces/ubi/beneficiary';
import { calcuateCommunitiesMetrics } from '../../../../src/worker/jobs/cron/community';
import BeneficiaryFactory from '../../../factories/beneficiary';
import BeneficiaryTransactionFactory from '../../../factories/beneficiaryTransaction';
import ClaimFactory from '../../../factories/claim';
import CommunityFactory from '../../../factories/community';
import InflowFactory from '../../../factories/inflow';
import UserFactory from '../../../factories/user';
import truncate, { sequelizeSetup } from '../../../utils/sequelizeSetup';
import { jumpToTomorrowMidnight } from '../../../utils/utils';

/**
 * IMPORTANT NOTE: this tests use time travel to test different scenarios
 */
describe('calcuateCommunitiesMetrics', () => {
    let communities: any[] = [];
    let sequelize: Sequelize;
    let ubiCommunityDailyStateCreate: Sinon.SinonSpy<
        [
            values?: any,
            options?: CreateOptions<any>
        ],
        Promise<Model<any, any>>
    >;
    let ubiCommunityDailyMetricsCreate: Sinon.SinonSpy<
        [
            values?: any,
            options?: CreateOptions<any>
        ],
        Promise<Model<any, any>>
    >;

    before(async () => {
        sequelize = sequelizeSetup();
        ubiCommunityDailyStateCreate = spy(
            models.ubiCommunityDailyState,
            'create'
        );
        ubiCommunityDailyMetricsCreate = spy(
            models.ubiCommunityDailyMetrics,
            'create'
        );
    });

    after(async () => {
        await ubiCommunityDailyStateCreate.restore();
        await ubiCommunityDailyMetricsCreate.restore();
    });

    describe('recent community with beneficiaries', () => {
        let users: AppUser[];
        let beneficiaries: BeneficiaryAttributes[];
        let community: any;
        beforeEach(async () => {
            // THIS IS HAPPENING TODAY
            tk.travel(jumpToTomorrowMidnight());
            users = await UserFactory({ n: 2 });
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
            community = communities[0];
        });

        afterEach(async () => {
            // this two has to come first!
            await truncate(sequelize, 'Inflow');
            await truncate(sequelize, 'UbiClaimModel');
            await truncate(sequelize, 'UbiBeneficiaryTransactionModel');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'AppUserModel');
            await truncate(sequelize);
        });

        it('txs and inflow, few claims', async () => {
            await InflowFactory(community);
            await InflowFactory(community);
            beneficiaries = await BeneficiaryFactory(users, community.id);
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[1], community);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[1], community);
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                amount: '500000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                withAddress: beneficiaries[1].address,
                amount: '1000000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[1], false, {
                amount: '1000000000000000000',
            });
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();

            // test
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 1);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(0), {
                transactions: 3,
                reach: 3,
                reachOut: 2,
                volume: '2500000000000000000',
                backers: 1,
                monthlyBackers: 3,
                raised: match.any,
                claimed: '2000000000000000000',
                claims: 2,
                fundingRate: 80,
                communityId: communities[0].id,
                date: match.any,
                beneficiaries: 0,
            });
        });

        it('txs and inflow, stops activity for four days', async () => {
            await InflowFactory(community);
            await InflowFactory(community);
            beneficiaries = await BeneficiaryFactory(users, community.id);
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[1], community);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[1], community);
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                amount: '500000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                withAddress: beneficiaries[1].address,
                amount: '1000000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[1], false, {
                amount: '1000000000000000000',
            });
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();

            // test
            // THIS IS HAPPENING THREE DAYS FROM NOW
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING FOUR DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING FIVE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING SIX DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();

            assert.callCount(ubiCommunityDailyStateCreate, 4);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(3), {
                communityId: communities[0].id,
                date: match.any,
                transactions: 0,
                reach: 0,
                reachOut: 0,
                volume: '0',
                backers: 0,
                monthlyBackers: 3,
                raised: '0',
                claimed: '0',
                claims: 0,
                fundingRate: 80,
                beneficiaries: 0,
            });
        });

        it('txs and inflow, stops activity for two days and gets activity again', async () => {
            await InflowFactory(community);
            await InflowFactory(community);
            beneficiaries = await BeneficiaryFactory(users, community.id);
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[1], community);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[1], community);
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                amount: '500000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                withAddress: beneficiaries[1].address,
                amount: '1000000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[1], false, {
                amount: '1000000000000000000',
            });
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();

            // test
            // THIS IS HAPPENING THREE DAYS FROM NOW
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING FOUR DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING FIVE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[1], community);
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                amount: '500000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                withAddress: beneficiaries[1].address,
                amount: '1000000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[1], false, {
                amount: '1000000000000000000',
            });
            await InflowFactory(community);

            // THIS IS HAPPENING SIX DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();

            assert.callCount(ubiCommunityDailyStateCreate, 4);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(3), {
                communityId: communities[0].id,
                date: match.any,
                transactions: 3,
                reach: 3,
                reachOut: 2,
                volume: '2500000000000000000',
                backers: 1,
                monthlyBackers: 4,
                raised: '5000000000000000000',
                claimed: '2000000000000000000',
                claims: 2,
                fundingRate: 80,
                beneficiaries: 0,
            });
        });

        it('inflow no txs, few claims', async () => {
            // THIS IS HAPPENING TODAY
            await InflowFactory(community);
            await InflowFactory(community);
            const beneficiaries = await BeneficiaryFactory(users, community.id);
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[1], community);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[1], community);
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();

            //tests
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 1);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(0), {
                transactions: 0,
                reach: 0,
                reachOut: 0,
                volume: '0',
                backers: 1,
                monthlyBackers: 3,
                raised: match.any,
                claimed: '2000000000000000000',
                claims: 2,
                fundingRate: match.any,
                communityId: communities[0].id,
                date: match.any,
                beneficiaries: 0,
            });
        });

        it('inflow beneficiaries, no claims', async () => {
            await InflowFactory(community);
            await InflowFactory(community);
            await BeneficiaryFactory(users, community.id);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();
            await ubiCommunityDailyMetricsCreate.resetHistory();

            // tests
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 1);
            assert.callCount(ubiCommunityDailyMetricsCreate, 0);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(0), {
                transactions: 0,
                reach: 0,
                reachOut: 0,
                volume: '0',
                backers: 2,
                monthlyBackers: 2,
                raised: match.any,
                claimed: '0',
                claims: 0,
                fundingRate: match.any,
                communityId: communities[0].id,
                date: match.any,
                beneficiaries: 2,
            });
        });

        it('no claims', async () => {
            await InflowFactory(community);
            await BeneficiaryFactory(users, community.id);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();
            await ubiCommunityDailyMetricsCreate.resetHistory();

            // test
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 1);
            assert.callCount(ubiCommunityDailyMetricsCreate, 0);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(0), {
                transactions: 0,
                reach: 0,
                reachOut: 0,
                volume: '0',
                backers: 1,
                monthlyBackers: 1,
                raised: match.any,
                claimed: '0',
                claims: 0,
                fundingRate: match.any,
                communityId: communities[0].id,
                date: match.any,
                beneficiaries: 2,
            });
        });

        it('first metrics, few claims', async () => {
            await InflowFactory(community);
            await InflowFactory(community);
            const beneficiaries = await BeneficiaryFactory(users, community.id);
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[1], community);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            await ubiCommunityDailyStateCreate.resetHistory();

            // test
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 1);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(0), {
                transactions: 0,
                reach: 0,
                reachOut: 0,
                volume: '0',
                backers: 2,
                monthlyBackers: 2,
                raised: match.any,
                claimed: '2000000000000000000',
                claims: 2,
                fundingRate: match.any,
                communityId: communities[0].id,
                date: match.any,
                beneficiaries: 2,
            });
        });

        it('first metrics, not enough claims', async () => {
            await InflowFactory(community);
            await InflowFactory(community);
            const beneficiaries = await BeneficiaryFactory(users, community.id);
            await ClaimFactory(beneficiaries[0], community);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();
            await ubiCommunityDailyMetricsCreate.resetHistory();

            // test
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 1);
            assert.callCount(ubiCommunityDailyMetricsCreate, 0);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(0), {
                transactions: 0,
                reach: 0,
                reachOut: 0,
                volume: '0',
                backers: 2,
                monthlyBackers: 2,
                raised: match.any,
                claimed: '1000000000000000000',
                claims: 1,
                fundingRate: match.any,
                communityId: communities[0].id,
                date: match.any,
                beneficiaries: 2,
            });
        });

        it('no beneficiaries', async () => {
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();
            await ubiCommunityDailyMetricsCreate.resetHistory();

            // test
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 1);
            assert.callCount(ubiCommunityDailyMetricsCreate, 0);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(0), {
                transactions: 0,
                reach: 0,
                reachOut: 0,
                volume: '0',
                backers: 1,
                monthlyBackers: 1,
                raised: match.any,
                claimed: '0',
                claims: 0,
                fundingRate: match.any,
                communityId: communities[0].id,
                date: match.any,
                beneficiaries: 0,
            });
        });
    });

    describe('recent community with added/removed beneficiaries, txs and inflow', () => {
        before(async () => {
            // THIS IS HAPPENING TODAY
            tk.travel(jumpToTomorrowMidnight());
            const users = await UserFactory({ n: 6 });
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
                },
            };
            await InflowFactory(community);
            await InflowFactory(community);
            let beneficiaries = await BeneficiaryFactory(
                users.slice(0, 4),
                community.id
            );
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[1], community);
            await ClaimFactory(beneficiaries[2], community);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            beneficiaries = beneficiaries.concat(
                await BeneficiaryFactory([users[4]], community.id)
            );
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[2], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[4], community);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await BeneficiaryFactory(users.slice(1, 4), community.id, true);
            beneficiaries = beneficiaries.concat(
                await BeneficiaryFactory([users[5]], community.id)
            );
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[4], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[5], community);
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                amount: '500000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[0], true, {
                withAddress: beneficiaries[1].address,
                amount: '1000000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[1], false, {
                amount: '1000000000000000000',
            });
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            await ubiCommunityDailyStateCreate.resetHistory();
        });

        after(async () => {
            await truncate(sequelize, 'Inflow');
            await truncate(sequelize, 'UbiClaimModel');
            await truncate(sequelize, 'UbiBeneficiaryTransactionModel');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'AppUserModel');
            await truncate(sequelize, 'Community');
        });

        it('few claims', async () => {
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 1);
            assert.calledWith(ubiCommunityDailyStateCreate.getCall(0), {
                transactions: 3,
                reach: 3,
                reachOut: 3,
                volume: '2500000000000000000',
                backers: 1,
                monthlyBackers: 3,
                raised: '5000000000000000000',
                claimed: '3000000000000000000',
                claims: 3,
                fundingRate: 81.81,
                beneficiaries: -2,
                communityId: communities[0].id,
                date: match.any,
            });
        });
    });
});
