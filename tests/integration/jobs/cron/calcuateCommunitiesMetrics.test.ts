import { Sequelize } from 'sequelize';
import { assert, match, stub } from 'sinon';
import tk from 'timekeeper';

import { models } from '../../../../src/database';
import { calcuateCommunitiesMetrics } from '../../../../src/worker/jobs/cron/community';
import BeneficiaryFactory from '../../../factories/beneficiary';
import BeneficiaryTransactionFactory from '../../../factories/beneficiaryTransaction';
import ClaimFactory from '../../../factories/claim';
import CommunityFactory from '../../../factories/community';
import InflowFactory from '../../../factories/inflow';
import UserFactory from '../../../factories/user';
import truncate, { sequelizeSetup } from '../../../utils/sequelizeSetup';

/**
 * IMPORTANT NOTE: this tests use time travel to test different scenarios
 */
describe('calcuateCommunitiesMetrics', () => {
    let communities: any[] = [];
    let sequelize: Sequelize;
    const ubiCommunityDailyStateUpdate = stub(
        models.ubiCommunityDailyState,
        'update'
    );
    ubiCommunityDailyStateUpdate.returns(Promise.resolve({} as any));
    before(async () => {
        sequelize = sequelizeSetup();
    });
    describe('recent community with beneficiaries, txs and inflow', () => {
        before(async () => {
            sequelize = sequelizeSetup();

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
            tk.travel(
                new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000
            );
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(
                new Date().getTime() + 1000 * 60 * 60 * 24 + 36 * 60 * 1000
            );
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
            tk.travel(
                new Date().getTime() + 1000 * 60 * 60 * 24 + 30 * 60 * 1000
            );
            ubiCommunityDailyStateUpdate.resetHistory();
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
            assert.callCount(ubiCommunityDailyStateUpdate, 1);
            assert.calledWith(
                ubiCommunityDailyStateUpdate.getCall(0),
                {
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
                },
                {
                    where: { communityId: communities[0].id, date: match.any },
                }
            );
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
            tk.travel(
                new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000
            );
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(
                new Date().getTime() + 1000 * 60 * 60 * 24 + 36 * 60 * 1000
            );
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await ClaimFactory(beneficiaries[1], community);
            await InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(
                new Date().getTime() + 1000 * 60 * 60 * 24 + 30 * 60 * 1000
            );
            ubiCommunityDailyStateUpdate.resetHistory();
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
            assert.callCount(ubiCommunityDailyStateUpdate, 1);
            assert.calledWith(
                ubiCommunityDailyStateUpdate.getCall(0),
                {
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
                },
                {
                    where: { communityId: communities[0].id, date: match.any },
                }
            );
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
            tk.travel(
                new Date().getTime() + 1000 * 60 * 60 * 24 + 12 * 60 * 1000
            );
            await ClaimFactory(beneficiaries[0], community);
            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await ClaimFactory(beneficiaries[1], community);
            ubiCommunityDailyStateUpdate.resetHistory();
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
            assert.callCount(ubiCommunityDailyStateUpdate, 1);
            assert.calledWith(
                ubiCommunityDailyStateUpdate.getCall(0),
                {
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
                },
                {
                    where: { communityId: communities[0].id, date: match.any },
                }
            );
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
            ubiCommunityDailyStateUpdate.resetHistory();
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
            assert.callCount(ubiCommunityDailyStateUpdate, 0);
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
            tk.travel(
                new Date().getTime() + 1000 * 60 * 60 * 24 * 3 + 30 * 60 * 1000
            );
            ubiCommunityDailyStateUpdate.resetHistory();
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
            assert.callCount(ubiCommunityDailyStateUpdate, 0);
        });
    });
});
