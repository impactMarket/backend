import { CreateOptions, Sequelize } from 'sequelize';
import Sinon, { assert, match, stub } from 'sinon';
import tk from 'timekeeper';

import { models } from '../../../../src/database';
import { BeneficiaryAttributes } from '../../../../src/database/models/ubi/beneficiary';
import { User } from '../../../../src/interfaces/app/user';
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
    let ubiCommunityDailyStateCreate: Sinon.SinonStub<
        [
            any,
            CreateOptions<any> & {
                returning: false;
            }
        ],
        Promise<void>
    >;

    before(async () => {
        sequelize = sequelizeSetup();
        ubiCommunityDailyStateCreate = stub(
            models.ubiCommunityDailyState,
            'create'
        );
        ubiCommunityDailyStateCreate.returns(Promise.resolve({} as any));
    });

    after(() => {
        ubiCommunityDailyStateCreate.restore();
    });

    describe('recent community with beneficiaries, txs and inflow', () => {
        let users: User[];
        let beneficiaries: BeneficiaryAttributes[];
        let community: any;
        beforeEach(async () => {
            sequelize = sequelizeSetup();

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
            community = {
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
            beneficiaries = await BeneficiaryFactory(users, community.publicId);
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
                toBeneficiary: beneficiaries[1],
                amount: '1000000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[1], false, {
                amount: '1000000000000000000',
            });
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
        });

        afterEach(async () => {
            await truncate(sequelize, 'Inflow');
            await truncate(sequelize, 'Claim');
            await truncate(sequelize, 'BeneficiaryTransaction');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'UserModel');
            await truncate(sequelize, 'Community');
        });

        it('few claims', async () => {
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

        it('stops activity for four days', async () => {
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

        it('stops activity for two days and gets activity again', async () => {
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
                toBeneficiary: beneficiaries[1],
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
    });

    describe('recent community with added/removed beneficiaries, txs and inflow', () => {
        before(async () => {
            sequelize = sequelizeSetup();

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
                community.publicId
            );
            await ClaimFactory(beneficiaries[0], community);
            await ClaimFactory(beneficiaries[1], community);
            await ClaimFactory(beneficiaries[2], community);

            // THIS IS HAPPENING TOMORROW
            tk.travel(jumpToTomorrowMidnight());
            beneficiaries = beneficiaries.concat(
                await BeneficiaryFactory([users[4]], community.publicId)
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
            await BeneficiaryFactory(
                users.slice(1, 4),
                community.publicId,
                true
            );
            beneficiaries = beneficiaries.concat(
                await BeneficiaryFactory([users[5]], community.publicId)
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
                toBeneficiary: beneficiaries[1],
                amount: '1000000000000000000',
            });
            await BeneficiaryTransactionFactory(beneficiaries[1], false, {
                amount: '1000000000000000000',
            });
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
        });

        after(async () => {
            await truncate(sequelize, 'Inflow');
            await truncate(sequelize, 'Claim');
            await truncate(sequelize, 'BeneficiaryTransaction');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'UserModel');
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

    describe('recent community with beneficiaries, inflow no txs', () => {
        before(async () => {
            // THIS IS HAPPENING TODAY
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
                },
            };
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
            ubiCommunityDailyStateCreate.resetHistory();
        });

        after(async () => {
            await truncate(sequelize, 'Inflow');
            await truncate(sequelize, 'Claim');
            await truncate(sequelize, 'BeneficiaryTransaction');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'UserModel');
            await truncate(sequelize, 'Community');
        });

        it('few claims', async () => {
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
    });

    describe('recent community with beneficiaries, first metrics', () => {
        before(async () => {
            // THIS IS HAPPENING TODAY
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
                },
            };
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
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            ubiCommunityDailyStateCreate.resetHistory();
        });

        after(async () => {
            await truncate(sequelize, 'Inflow');
            await truncate(sequelize, 'Claim');
            await truncate(sequelize, 'BeneficiaryTransaction');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'UserModel');
            await truncate(sequelize, 'Community');
        });

        it('few claims', async () => {
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
    });

    describe('recent community with beneficiaries, no claims', () => {
        before(async () => {
            // THIS IS HAPPENING TODAY
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
                },
            };
            await InflowFactory(community);
            await BeneficiaryFactory(users, community.publicId);
            ubiCommunityDailyStateCreate.resetHistory();
        });

        after(async () => {
            await truncate(sequelize, 'Inflow');
            await truncate(sequelize, 'Claim');
            await truncate(sequelize, 'BeneficiaryTransaction');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'UserModel');
            await truncate(sequelize, 'Community');
        });

        it('few claims', async () => {
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 0);
        });
    });

    describe('recent community with no beneficiaries', () => {
        before(async () => {
            // THIS IS HAPPENING TODAY
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
                },
            };
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
        });

        after(async () => {
            await truncate(sequelize, 'Inflow');
            await truncate(sequelize, 'Claim');
            await truncate(sequelize, 'BeneficiaryTransaction');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'UserModel');
            await truncate(sequelize, 'Community');
        });

        it('few claims', async () => {
            await calcuateCommunitiesMetrics();
            assert.callCount(ubiCommunityDailyStateCreate, 0);
        });
    });
});
