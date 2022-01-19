import { database, interfaces, tests, subgraph } from '@impactmarket/core';
import { CreateOptions, Model, Sequelize } from 'sequelize';
import Sinon, { assert, match, spy, SinonStub, stub } from 'sinon';
import tk from 'timekeeper';

import { calcuateCommunitiesMetrics } from '../../../src/jobs/cron/community';

/**
 * IMPORTANT NOTE: this tests use time travel to test different scenarios
 */
describe('calcuateCommunitiesMetrics', () => {
    let communities: any[] = [];
    let sequelize: Sequelize;
    let ubiCommunityDailyStateCreate: Sinon.SinonSpy<
        [values?: any, options?: CreateOptions<any>],
        Promise<Model<any, any>>
    >;
    let ubiCommunityDailyMetricsCreate: Sinon.SinonSpy<
        [values?: any, options?: CreateOptions<any>],
        Promise<Model<any, any>>
    >;
    let returnSubgraph: SinonStub;

    before(async () => {
        sequelize = tests.config.setup.sequelizeSetup();
        ubiCommunityDailyStateCreate = spy(
            database.models.ubiCommunityDailyState,
            'create'
        );
        ubiCommunityDailyMetricsCreate = spy(
            database.models.ubiCommunityDailyMetrics,
            'create'
        );
        returnSubgraph = stub(subgraph.queries.beneficiary, 'getBeneficiaries');
    });

    after(async () => {
        ubiCommunityDailyStateCreate.restore();
        ubiCommunityDailyMetricsCreate.restore();
        returnSubgraph.restore();
    });

    describe('recent community with beneficiaries', () => {
        let users: interfaces.app.appUser.AppUser[];
        let beneficiaries: interfaces.ubi.beneficiary.BeneficiaryAttributes[];
        let community: any;
        beforeEach(async () => {
            // THIS IS HAPPENING TODAY
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            users = await tests.factories.UserFactory({ n: 2 });
            communities = await tests.factories.CommunityFactory([
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
            await tests.config.setup.truncate(sequelize, 'Inflow');
            await tests.config.setup.truncate(sequelize, 'UbiClaimModel');
            await tests.config.setup.truncate(
                sequelize,
                'UbiBeneficiaryTransactionModel'
            );
            await tests.config.setup.truncate(sequelize, 'Beneficiary');
            await tests.config.setup.truncate(sequelize, 'AppUserModel');
            await tests.config.setup.truncate(sequelize);
            returnSubgraph.resetHistory();
        });

        it('txs and inflow, few claims', async () => {
            const beneficiariesSubgraph: {
                lastClaimAt: number;
                preLastClaimAt: number;
                claims: number;
                community: {
                    id: string;
                };
            }[] = [];

            await tests.factories.InflowFactory(community);
            await tests.factories.InflowFactory(community);
            beneficiaries = await tests.factories.BeneficiaryFactory(
                users,
                community.id
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            returnSubgraph.returns(beneficiariesSubgraph);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    amount: '500000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    withAddress: beneficiaries[1].address,
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[1],
                false,
                {
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
            returnSubgraph.resetHistory();
            returnSubgraph.returns(beneficiariesSubgraph);

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
            const beneficiariesSubgraph: {
                lastClaimAt: number;
                preLastClaimAt: number;
                claims: number;
                community: {
                    id: string;
                };
            }[] = [];

            await tests.factories.InflowFactory(community);
            await tests.factories.InflowFactory(community);
            beneficiaries = await tests.factories.BeneficiaryFactory(
                users,
                community.id
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            returnSubgraph.returns(beneficiariesSubgraph);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    amount: '500000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    withAddress: beneficiaries[1].address,
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[1],
                false,
                {
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();

            returnSubgraph.resetHistory();
            returnSubgraph.returns(beneficiariesSubgraph);

            // test
            // THIS IS HAPPENING THREE DAYS FROM NOW
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING FOUR DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING FIVE DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING SIX DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
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
            const beneficiariesSubgraph: {
                lastClaimAt: number;
                preLastClaimAt: number;
                claims: number;
                community: {
                    id: string;
                };
            }[] = [];

            await tests.factories.InflowFactory(community);
            await tests.factories.InflowFactory(community);
            beneficiaries = await tests.factories.BeneficiaryFactory(
                users,
                community.id
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            returnSubgraph.returns(beneficiariesSubgraph);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    amount: '500000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    withAddress: beneficiaries[1].address,
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[1],
                false,
                {
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
            returnSubgraph.resetHistory();
            returnSubgraph.returns(beneficiariesSubgraph);

            // test
            // THIS IS HAPPENING THREE DAYS FROM NOW
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING FOUR DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING FIVE DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await calcuateCommunitiesMetrics();
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    amount: '500000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    withAddress: beneficiaries[1].address,
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[1],
                false,
                {
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.InflowFactory(community);

            // THIS IS HAPPENING SIX DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            returnSubgraph.resetHistory();
            returnSubgraph.returns(beneficiariesSubgraph);
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
            const beneficiariesSubgraph: {
                lastClaimAt: number;
                preLastClaimAt: number;
                claims: number;
                community: {
                    id: string;
                };
            }[] = [];

            // THIS IS HAPPENING TODAY
            await tests.factories.InflowFactory(community);
            await tests.factories.InflowFactory(community);
            const beneficiaries = await tests.factories.BeneficiaryFactory(
                users,
                community.id
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            returnSubgraph.returns(beneficiariesSubgraph);
            await calcuateCommunitiesMetrics();
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            returnSubgraph.resetHistory();
            returnSubgraph.returns(beneficiariesSubgraph);
            await calcuateCommunitiesMetrics();

            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            await tests.factories.InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
            returnSubgraph.resetHistory();
            returnSubgraph.returns(beneficiariesSubgraph);

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
            await tests.factories.InflowFactory(community);
            await tests.factories.InflowFactory(community);
            await tests.factories.BeneficiaryFactory(users, community.id);

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
            ubiCommunityDailyMetricsCreate.resetHistory();

            // tests
            returnSubgraph.returns([
                {
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    claims: 0,
                    community: {
                        id: community.contractAddress.toLowerCase(),
                    },
                },
                {
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    claims: 0,
                    community: {
                        id: community.contractAddress.toLowerCase(),
                    },
                },
            ]);
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
            await tests.factories.InflowFactory(community);
            await tests.factories.BeneficiaryFactory(users, community.id);

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
            ubiCommunityDailyMetricsCreate.resetHistory();

            // test
            returnSubgraph.returns([
                {
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    claims: 0,
                    community: {
                        id: community.contractAddress.toLowerCase(),
                    },
                },
                {
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    claims: 0,
                    community: {
                        id: community.contractAddress.toLowerCase(),
                    },
                },
            ]);
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
            const beneficiariesSubgraph: {
                lastClaimAt: number;
                preLastClaimAt: number;
                claims: number;
                community: {
                    id: string;
                };
            }[] = [];

            await tests.factories.InflowFactory(community);
            await tests.factories.InflowFactory(community);
            const beneficiaries = await tests.factories.BeneficiaryFactory(
                users,
                community.id
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            ubiCommunityDailyStateCreate.resetHistory();

            // test
            returnSubgraph.returns(beneficiariesSubgraph);
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
            const beneficiary1 = {
                lastClaimAt: 0,
                preLastClaimAt: 0,
                claims: 0,
            };

            await tests.factories.InflowFactory(community);
            await tests.factories.InflowFactory(community);
            const beneficiaries = await tests.factories.BeneficiaryFactory(
                users,
                community.id
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiary1.lastClaimAt = new Date().getTime() / 1000;
            beneficiary1.claims += 1;

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
            ubiCommunityDailyMetricsCreate.resetHistory();

            // test
            returnSubgraph.returns([
                {
                    lastClaimAt: beneficiary1.lastClaimAt,
                    preLastClaimAt: beneficiary1.preLastClaimAt,
                    claims: beneficiary1.claims,
                    community: {
                        id: community.contractAddress.toLowerCase(),
                    },
                },
            ]);
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
            await tests.factories.InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
            ubiCommunityDailyMetricsCreate.resetHistory();

            // test
            returnSubgraph.returns([]);
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
        const beneficiariesSubgraph: {
            lastClaimAt: number;
            preLastClaimAt: number;
            claims: number;
            community: {
                id: string;
            };
        }[] = [];

        before(async () => {
            // THIS IS HAPPENING TODAY
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            const users = await tests.factories.UserFactory({ n: 6 });
            communities = await tests.factories.CommunityFactory([
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
            await tests.factories.InflowFactory(community);
            await tests.factories.InflowFactory(community);
            let beneficiaries = await tests.factories.BeneficiaryFactory(
                users.slice(0, 4),
                community.id
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });
            await tests.factories.ClaimFactory(beneficiaries[2], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });

            // THIS IS HAPPENING TOMORROW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            beneficiaries = beneficiaries.concat(
                await tests.factories.BeneficiaryFactory(
                    [users[4]],
                    community.id
                )
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await tests.factories.ClaimFactory(beneficiaries[1], community);
            beneficiariesSubgraph[1].preLastClaimAt =
                beneficiariesSubgraph[1].lastClaimAt;
            beneficiariesSubgraph[1].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[1].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 3);
            await tests.factories.ClaimFactory(beneficiaries[2], community);
            beneficiariesSubgraph[2].preLastClaimAt =
                beneficiariesSubgraph[2].lastClaimAt;
            beneficiariesSubgraph[2].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[2].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await tests.factories.ClaimFactory(beneficiaries[4], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });

            returnSubgraph.returns(beneficiariesSubgraph);
            await calcuateCommunitiesMetrics();

            // THIS IS HAPPENING TWO DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            await tests.factories.BeneficiaryFactory(
                users.slice(1, 4),
                community.id,
                true
            );
            beneficiaries = beneficiaries.concat(
                await tests.factories.BeneficiaryFactory(
                    [users[5]],
                    community.id
                )
            );
            await tests.factories.ClaimFactory(beneficiaries[0], community);
            beneficiariesSubgraph[0].preLastClaimAt =
                beneficiariesSubgraph[0].lastClaimAt;
            beneficiariesSubgraph[0].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[0].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await tests.factories.ClaimFactory(beneficiaries[4], community);
            beneficiariesSubgraph[3].preLastClaimAt =
                beneficiariesSubgraph[3].lastClaimAt;
            beneficiariesSubgraph[3].lastClaimAt = new Date().getTime() / 1000;
            beneficiariesSubgraph[3].claims += 1;

            tk.travel(new Date().getTime() + 1000 * 60 * 8);
            await tests.factories.ClaimFactory(beneficiaries[5], community);
            beneficiariesSubgraph.push({
                lastClaimAt: new Date().getTime() / 1000,
                preLastClaimAt: 0,
                claims: 1,
                community: {
                    id: community.contractAddress!.toLowerCase(),
                },
            });

            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    amount: '500000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[0],
                true,
                {
                    withAddress: beneficiaries[1].address,
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.BeneficiaryTransactionFactory(
                beneficiaries[1],
                false,
                {
                    amount: '1000000000000000000',
                }
            );
            await tests.factories.InflowFactory(community);

            // THIS IS HAPPENING THREE DAYS FROM NOW
            tk.travel(tests.config.utils.jumpToTomorrowMidnight());
            ubiCommunityDailyStateCreate.resetHistory();
            returnSubgraph.resetHistory();
        });

        after(async () => {
            await tests.config.setup.truncate(sequelize, 'Inflow');
            await tests.config.setup.truncate(sequelize, 'UbiClaimModel');
            await tests.config.setup.truncate(
                sequelize,
                'UbiBeneficiaryTransactionModel'
            );
            await tests.config.setup.truncate(sequelize, 'Beneficiary');
            await tests.config.setup.truncate(sequelize, 'AppUserModel');
            await tests.config.setup.truncate(sequelize, 'Community');
        });

        it('few claims', async () => {
            returnSubgraph.returns(beneficiariesSubgraph);
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
