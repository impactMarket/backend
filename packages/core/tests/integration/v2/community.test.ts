import { expect } from 'chai';
import { ethers } from 'ethers';
import { Sequelize } from 'sequelize';
import { replace, stub, SinonStub } from 'sinon';

import { models, sequelize as database } from '../../../src/database';
import { AppUser } from '../../../src/interfaces/app/appUser';
import { CommunityContentStorage } from '../../../src/services/storage';
import { CommunityListService } from '../../../src/services/ubi/community/list';
import * as subgraph from '../../../src/subgraph/queries/community';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import BeneficiaryFactory from '../../factories/beneficiary';
import CommunityFactory from '../../factories/community';
import UserFactory from '../../factories/user';

describe('community service v2', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let returnProposalsSubgraph: SinonStub;
    let returnClaimedSubgraph: SinonStub;
    let returnCommunityStateSubgraph: SinonStub;
    let returnCommunityEntities: SinonStub;

    type SubgraphClaimed = { id: string; claimed: number }[];

    const communityListService = new CommunityListService();

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
        users = await UserFactory({ n: 5 });
        replace(database, 'query', sequelize.query);

        replace(
            CommunityContentStorage.prototype,
            'deleteContent',
            async (mediaId: number) => {
                //
            }
        );

        returnProposalsSubgraph = stub(subgraph, 'getCommunityProposal');
        returnCommunityEntities = stub(subgraph, 'communityEntities');
        returnClaimedSubgraph = stub(subgraph, 'getClaimed');
        returnCommunityStateSubgraph = stub(subgraph, 'getCommunityState');
        returnCommunityStateSubgraph.returns([
            {
                claims: 0,
                claimed: '0',
                beneficiaries: 0,
                removedBeneficiaries: 0,
                contributed: '0',
                contributors: 0,
                managers: 0,
            },
        ]);
    });

    describe('list', () => {
        afterEach(async () => {
            await truncate(sequelize, 'Beneficiary');
            returnClaimedSubgraph.resetHistory();
            returnCommunityEntities.resetHistory();
        });

        after(async () => {
            returnProposalsSubgraph.restore();
            returnCommunityEntities.restore();
        });

        describe('by name', () => {
            afterEach(async () => {
                await truncate(sequelize, 'Community');
            });

            it('full name', async () => {
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

                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                returnClaimedSubgraph.returns([
                    {
                        id: communities[0].contractAddress,
                        claimed: 0,
                    },
                ]);

                const result = await communityListService.list({
                    name: communities[0].name,
                });

                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    name: communities[0].name,
                    country: communities[0].country,
                    requestByAddress: users[0].address,
                });
            });

            it('first half name', async () => {
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

                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                returnClaimedSubgraph.returns([
                    {
                        id: communities[0].contractAddress,
                        claimed: 0,
                    },
                ]);

                const result = await communityListService.list({
                    name: communities[0].name.slice(
                        0,
                        communities[0].name.length / 2
                    ),
                });

                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    name: communities[0].name,
                    country: communities[0].country,
                    requestByAddress: users[0].address,
                });
            });

            it('last half name', async () => {
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

                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                returnClaimedSubgraph.returns([
                    {
                        id: communities[0].contractAddress,
                        claimed: 0,
                    },
                ]);

                const result = await communityListService.list({
                    name: communities[0].name.slice(
                        communities[0].name.length / 2,
                        communities[0].name.length - 1
                    ),
                });

                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    name: communities[0].name,
                    country: communities[0].country,
                    requestByAddress: users[0].address,
                });
            });

            it('UPPERCASE name', async () => {
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

                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                returnClaimedSubgraph.returns([
                    {
                        id: communities[0].contractAddress,
                        claimed: 0,
                    },
                ]);

                const result = await communityListService.list({
                    name: communities[0].name.toUpperCase(),
                });

                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    name: communities[0].name,
                    country: communities[0].country,
                    requestByAddress: users[0].address,
                });
            });

            it('two with similar name', async () => {
                const communities = await CommunityFactory([
                    {
                        requestByAddress: users[0].address,
                        name: 'oreoland', // no space on purpose
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
                        requestByAddress: users[1].address,
                        name: 'oreo sea',
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
                        name: 'itsdifferent',
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

                returnCommunityEntities.returns(
                    communities.map((el) => ({
                        id: el.contractAddress,
                        beneficiaries: 0,
                    }))
                );

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await communityListService.list({
                    name: 'oreo',
                });

                expect(result.count).to.be.equal(2);

                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    name: communities[0].name,
                    country: communities[0].country,
                    requestByAddress: users[0].address,
                });

                expect(result.rows[1]).to.include({
                    id: communities[1].id,
                    name: communities[1].name,
                    country: communities[1].country,
                    requestByAddress: users[1].address,
                });
            });

            it('list all communities', async () => {
                const communities = await CommunityFactory([
                    {
                        requestByAddress: users[0].address,
                        name: 'oreoland', // no space on purpose
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
                        requestByAddress: users[1].address,
                        name: 'oreo sea',
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

                returnCommunityEntities.returns(
                    communities.map((el) => ({
                        id: el.contractAddress,
                        beneficiaries: 0,
                    }))
                );

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await communityListService.list({});

                result.rows.forEach((el) => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(el.email).to.be.undefined;
                });
            });
        });

        describe('by country', () => {
            afterEach(async () => {
                await truncate(sequelize, 'Community');
            });

            it('single country', async () => {
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
                        country: 'PT',
                    },
                    {
                        requestByAddress: users[1].address,
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
                        country: 'PT',
                    },
                    {
                        requestByAddress: users[2].address,
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
                        country: 'ES',
                    },
                ]);

                returnCommunityEntities.returns(
                    communities.map((el) => ({
                        id: el.contractAddress,
                        beneficiaries: 0,
                    }))
                );

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await communityListService.list({
                    country: 'PT',
                });

                expect(result.count).to.be.equal(2);
                (expect(result.rows).to as any).containSubset([
                    {
                        id: communities[0].id,
                    },
                    {
                        id: communities[1].id,
                    },
                ]);
            });

            it('many country', async () => {
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
                        country: 'PT',
                    },
                    {
                        requestByAddress: users[1].address,
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
                        country: 'PT',
                    },
                    {
                        requestByAddress: users[2].address,
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
                        country: 'ES',
                    },
                    {
                        requestByAddress: users[3].address,
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
                        country: 'FR',
                    },
                    {
                        requestByAddress: users[4].address,
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
                        country: 'MZ',
                    },
                ]);

                returnCommunityEntities.returns(
                    communities.map((el) => ({
                        id: el.contractAddress,
                        beneficiaries: 0,
                    }))
                );

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await communityListService.list({
                    country: 'PT;ES;FR',
                });

                expect(result.count).to.be.equal(4);
                (expect(result.rows).to as any).containSubset([
                    {
                        id: communities[0].id,
                    },
                    {
                        id: communities[1].id,
                    },
                    {
                        id: communities[2].id,
                    },
                    {
                        id: communities[3].id,
                    },
                ]);
            });
        });

        it('large lists', async () => {
            const totalCommunities = 80;
            const communityManagers = await UserFactory({
                n: totalCommunities,
            });
            const createObject: any[] = [];
            for (let index = 0; index < totalCommunities; index++) {
                createObject.push({
                    requestByAddress: communityManagers[index].address,
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
                });
            }
            const communities = await CommunityFactory(createObject);
            const claimed: SubgraphClaimed = [];
            for (const community of communities) {
                claimed.push({
                    id: community.contractAddress!,
                    claimed: 0,
                });
                await BeneficiaryFactory(
                    await UserFactory({
                        n: Math.floor(Math.random() * 20),
                    }),
                    community.id
                );
            }

            returnCommunityEntities.returns(
                communities.map((el) => ({
                    id: el.contractAddress,
                    beneficiaries: 1,
                }))
            );

            returnClaimedSubgraph.returns(claimed);

            //

            const result: any[] = [];

            for (let index = 0; index < totalCommunities / 5; index++) {
                const r = await communityListService.list({
                    offset: (index * 5).toString(),
                    limit: '5',
                });
                expect(result).to.not.have.members(r.rows);
                result.push(r.rows);
            }
        }).timeout(120000); // exceptionally 120s timeout

        it('with suspect activity', async () => {
            const totalCommunities = 3;
            const communityManagers = await UserFactory({
                n: totalCommunities,
            });
            const suspect = { percentage: 50, suspect: 5 };
            const createObject: any[] = [];
            for (let index = 0; index < totalCommunities; index++) {
                createObject.push({
                    requestByAddress: communityManagers[index].address,
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
                    suspect: index === 1 ? suspect : undefined,
                });
            }
            const communities = await CommunityFactory(createObject);
            const communitySuspect = communities[1];

            const claimed: SubgraphClaimed = [];
            for (const community of communities) {
                claimed.push({
                    id: community.contractAddress!,
                    claimed: 0,
                });
                await BeneficiaryFactory(
                    await UserFactory({
                        n: Math.floor(Math.random() * 20),
                    }),
                    community.id
                );
            }

            returnCommunityEntities.returns(
                communities.map((el) => ({
                    id: el.contractAddress,
                    beneficiaries: 1,
                }))
            );

            returnClaimedSubgraph.returns(claimed);

            //
            const r = await communityListService.list({
                offset: '0',
                limit: '5',
            });
            expect(
                r.rows.filter((c) => c.id === communitySuspect.id)[0].suspect
                    ?.length
            ).to.be.equal(1);
            expect(
                r.rows.filter((c) => c.id !== communitySuspect.id)[0].suspect
                    ?.length
            ).to.be.equal(0);
        });

        describe('sort', () => {
            afterEach(async () => {
                await truncate(sequelize, 'Beneficiary');
                await truncate(sequelize, 'Community');
            });

            it('without query parameters (most beneficiaries)', async () => {
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                    {
                        requestByAddress: users[1].address,
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                ]);

                const claimed: SubgraphClaimed = [];
                for (const community of communities) {
                    claimed.push({
                        id: community.contractAddress!,
                        claimed: 0,
                    });
                    await BeneficiaryFactory(
                        await UserFactory({
                            n:
                                community.requestByAddress === users[0].address
                                    ? 3
                                    : 4,
                        }),
                        community.id
                    );
                }

                returnCommunityEntities.returns([
                    {
                        id: communities[1].contractAddress,
                        beneficiaries: 4,
                    },
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 3,
                    },
                ]);
                communities.forEach((el) => {
                    returnCommunityStateSubgraph
                        .withArgs(el.contractAddress)
                        .returns({
                            claims: 0,
                            claimed: '0',
                            beneficiaries:
                                el.requestByAddress === users[0].address
                                    ? 3
                                    : 4,
                            removedBeneficiaries: 0,
                            contributed: '0',
                            contributors: 0,
                            managers: 0,
                        });
                });

                const result = await communityListService.list({});

                expect(result.rows[0]).to.include({
                    id: communities[1].id,
                    name: communities[1].name,
                    country: communities[1].country,
                    requestByAddress: users[1].address,
                });
                expect(result.rows[1]).to.include({
                    id: communities[0].id,
                    name: communities[0].name,
                    country: communities[0].country,
                    requestByAddress: users[0].address,
                });
            });

            it('nearest', async () => {
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
                        gps: {
                            latitude: -15.8697203,
                            longitude: -47.9207824,
                        },
                    },
                    {
                        requestByAddress: users[1].address,
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                ]);

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await communityListService.list({
                    orderBy: 'nearest',
                    lat: '-23.4378873',
                    lng: '-46.4841214',
                });

                expect(result.rows[0]).to.include({
                    id: communities[1].id,
                    name: communities[1].name,
                    country: communities[1].country,
                    requestByAddress: users[1].address,
                });
            });

            it('nearest and most beneficiaries', async () => {
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                    {
                        requestByAddress: users[1].address,
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                    {
                        requestByAddress: users[2].address,
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
                        gps: {
                            latitude: -15.8697203,
                            longitude: -47.9207824,
                        },
                    },
                ]);

                const claimed: SubgraphClaimed = [];
                for (const community of communities) {
                    claimed.push({
                        id: community.contractAddress!,
                        claimed: 0,
                    });
                    await BeneficiaryFactory(
                        await UserFactory({
                            n:
                                community.requestByAddress === users[1].address
                                    ? 5
                                    : 4,
                        }),
                        community.id
                    );
                }

                returnCommunityEntities.returns([
                    {
                        id: communities[1].contractAddress,
                        beneficiaries: 5,
                    },
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 4,
                    },
                    {
                        id: communities[2].contractAddress,
                        beneficiaries: 4,
                    },
                ]);

                communities.forEach((el) => {
                    returnCommunityStateSubgraph
                        .withArgs(el.contractAddress)
                        .returns({
                            claims: 0,
                            claimed: '0',
                            beneficiaries:
                                el.requestByAddress === users[1].address
                                    ? 5
                                    : 4,
                            removedBeneficiaries: 0,
                            contributed: '0',
                            contributors: 0,
                            managers: 0,
                        });
                });

                const result = await communityListService.list({
                    orderBy: 'nearest:ASC;bigger:DESC',
                    lat: '-15.8697203',
                    lng: '-47.9207824',
                });

                expect(result.rows[0]).to.include({
                    id: communities[1].id,
                    name: communities[1].name,
                    country: communities[1].country,
                    requestByAddress: users[1].address,
                });
                expect(result.rows[1]).to.include({
                    id: communities[0].id,
                    name: communities[0].name,
                    country: communities[0].country,
                    requestByAddress: users[0].address,
                });
                expect(result.rows[2]).to.include({
                    id: communities[2].id,
                    name: communities[2].name,
                    country: communities[2].country,
                    requestByAddress: users[2].address,
                });
            });

            it('fewer beneficiaries and farthest', async () => {
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                    {
                        requestByAddress: users[1].address,
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
                        gps: {
                            latitude: -33.2799527,
                            longitude: 9.1421702,
                        },
                    },
                    {
                        requestByAddress: users[2].address,
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
                        gps: {
                            latitude: -15.8697203,
                            longitude: -47.9207824,
                        },
                    },
                ]);

                const claimed: SubgraphClaimed = [];
                for (const community of communities) {
                    claimed.push({
                        id: community.contractAddress!,
                        claimed: 0,
                    });
                    await BeneficiaryFactory(
                        await UserFactory({
                            n:
                                community.requestByAddress === users[2].address
                                    ? 3
                                    : 4,
                        }),
                        community.id
                    );
                }

                returnCommunityEntities.returns([
                    {
                        id: communities[2].contractAddress,
                        beneficiaries: 3,
                    },
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 4,
                    },
                    {
                        id: communities[1].contractAddress,
                        beneficiaries: 4,
                    },
                ]);

                const result = await communityListService.list({
                    orderBy: 'bigger:ASC;nearest:DESC',
                    lat: '-15.8697203',
                    lng: '-47.9207824',
                });

                expect(result.rows[0]).to.include({
                    id: communities[1].id,
                    name: communities[1].name,
                    country: communities[1].country,
                    requestByAddress: users[1].address,
                });
                expect(result.rows[1]).to.include({
                    id: communities[0].id,
                    name: communities[0].name,
                    country: communities[0].country,
                    requestByAddress: users[0].address,
                });
                expect(result.rows[2]).to.include({
                    id: communities[2].id,
                    name: communities[2].name,
                    country: communities[2].country,
                    requestByAddress: users[2].address,
                });
            });
        });

        describe('query string filter', () => {
            afterEach(async () => {
                await truncate(sequelize, 'Beneficiary');
                await truncate(sequelize, 'Community');
                returnProposalsSubgraph.resetHistory();
                returnClaimedSubgraph.resetHistory();
            });

            after(async () => {
                returnProposalsSubgraph.restore();
                returnClaimedSubgraph.restore();
            });

            it('filter with specific fields', async () => {
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                ]);

                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                const result = await communityListService.list({
                    fields: 'id;contractAddress;publicId;contract.maxClaim;contract.claimAmount',
                });

                expect(result.rows[0]).to.have.deep.keys([
                    'id',
                    'contractAddress',
                    'publicId',
                    'contract',
                ]);
                expect(result.rows[0].contract).to.have.deep.keys([
                    'claimAmount',
                    'maxClaim',
                ]);
                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    publicId: communities[0].publicId,
                });
                expect(result.rows[0].contract).to.include({
                    maxClaim: communities[0]!.contract!.maxClaim,
                    claimAmount: communities[0]!.contract!.claimAmount,
                });
            });

            it('filter with specific fields (proposal)', async () => {
                const proposal = await models.appProposal.create({
                    id: 5,
                    status: 0,
                    endBlock: 1150,
                });
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
                        proposalId: proposal.id,
                    },
                ]);

                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                const result = await communityListService.list({
                    fields: 'id;contractAddress;publicId;contract.maxClaim;proposal.*',
                });

                expect(result.rows[0]).to.have.deep.keys([
                    'id',
                    'contractAddress',
                    'publicId',
                    'contract',
                    'proposal',
                ]);
                expect(result.rows[0].contract).to.have.deep.keys(['maxClaim']);
                expect(result.rows[0].proposal).to.have.deep.keys([
                    'id',
                    'status',
                    'endBlock',
                ]);
                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    publicId: communities[0].publicId,
                });
                expect(result.rows[0].contract).to.include({
                    maxClaim: communities[0]!.contract!.maxClaim,
                });
                expect(result.rows[0].proposal).to.include({
                    id: proposal.id,
                });
            });

            it('filter with grouped fields', async () => {
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                ]);

                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                const result = await communityListService.list({
                    fields: '*;contract.*',
                });

                expect(result.rows[0]).to.have.deep.keys([
                    'city',
                    'contract',
                    'contractAddress',
                    'country',
                    'coverImage',
                    'coverMediaId',
                    'coverMediaPath',
                    'createdAt',
                    'currency',
                    'deletedAt',
                    'description',
                    'descriptionEn',
                    'gps',
                    'id',
                    'language',
                    'name',
                    'proposalId',
                    'ambassadorAddress',
                    'publicId',
                    'requestByAddress',
                    'review',
                    'started',
                    'status',
                    'updatedAt',
                    'visibility',
                ]);
                expect(result.rows[0].contract).to.have.deep.keys([
                    'claimAmount',
                    'maxClaim',
                    'blocked',
                    'decreaseStep',
                    'baseInterval',
                    'incrementInterval',
                    'communityId',
                    'createdAt',
                    'updatedAt',
                ]);
                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    publicId: communities[0].publicId,
                    city: communities[0].city,
                    contractAddress: communities[0].contractAddress,
                    country: communities[0].country,
                    coverImage: communities[0].coverImage,
                    coverMediaId: communities[0].coverMediaId,
                    currency: communities[0].currency,
                    description: communities[0].description,
                    descriptionEn: communities[0].descriptionEn,
                    language: communities[0].language,
                    name: communities[0].name,
                    requestByAddress: communities[0].requestByAddress,
                    review: communities[0].review,
                    started: communities[0].started,
                    status: communities[0].status,
                    visibility: communities[0].visibility,
                });
                expect(result.rows[0].contract).to.include({
                    maxClaim: communities[0]!.contract!.maxClaim,
                    claimAmount: communities[0]!.contract!.claimAmount,
                    baseInterval: communities[0]!.contract!.baseInterval,
                    incrementInterval:
                        communities[0]!.contract!.incrementInterval,
                    communityId: communities[0]!.contract!.communityId,
                });
            });

            it('filter with mixed fields', async () => {
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                ]);

                const media = await models.appMediaContent.create({
                    url: 'test.com',
                    width: 0,
                    height: 0,
                });

                await models.appMediaThumbnail.create({
                    mediaContentId: media.id,
                    url: 'test.com',
                    width: 0,
                    height: 0,
                    pixelRatio: 0,
                });

                await models.community.update(
                    {
                        coverMediaId: media.id,
                    },
                    {
                        where: {
                            id: communities[0].id,
                        },
                    }
                );

                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                const result = await communityListService.list({
                    fields: 'id;publicId;contractAddress;contract.*;cover.*',
                });

                expect(result.rows[0]).to.have.deep.keys([
                    'id',
                    'publicId',
                    'contractAddress',
                    'contract',
                    'cover',
                ]);
                expect(result.rows[0].contract).to.have.deep.keys([
                    'claimAmount',
                    'maxClaim',
                    'baseInterval',
                    'incrementInterval',
                    'communityId',
                    'blocked',
                    'decreaseStep',
                    'createdAt',
                    'updatedAt',
                ]);
                expect(result.rows[0].cover).to.have.deep.keys([
                    'id',
                    'url',
                    'thumbnails',
                ]);
                expect(result.rows[0].cover!.thumbnails![0]).to.have.deep.keys([
                    'url',
                    'width',
                    'height',
                    'pixelRatio',
                ]);
                expect(result.rows[0]).to.include({
                    id: communities[0].id,
                    publicId: communities[0].publicId,
                    contractAddress: communities[0].contractAddress,
                });
                expect(result.rows[0].contract).to.include({
                    maxClaim: communities[0]!.contract!.maxClaim,
                    claimAmount: communities[0]!.contract!.claimAmount,
                    baseInterval: communities[0]!.contract!.baseInterval,
                    incrementInterval:
                        communities[0]!.contract!.incrementInterval,
                    communityId: communities[0]!.contract!.communityId,
                });
            });

            it('filter pending community', async () => {
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
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                    {
                        requestByAddress: users[1].address,
                        started: new Date(),
                        status: 'pending',
                        visibility: 'public',
                        contract: {
                            baseInterval: 60 * 60 * 24,
                            claimAmount: '1000000000000000000',
                            communityId: 0,
                            incrementInterval: 5 * 60,
                            maxClaim: '450000000000000000000',
                        },
                        hasAddress: true,
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                    {
                        requestByAddress: users[2].address,
                        started: new Date(),
                        status: 'pending',
                        visibility: 'public',
                        contract: {
                            baseInterval: 60 * 60 * 24,
                            claimAmount: '1000000000000000000',
                            communityId: 0,
                            incrementInterval: 5 * 60,
                            maxClaim: '450000000000000000000',
                        },
                        hasAddress: true,
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                ]);

                const data = ethers.utils.defaultAbiCoder.encode(
                    [
                        'address[]',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256',
                    ],
                    [
                        [communities[2].requestByAddress],
                        communities[2].contract!.claimAmount,
                        communities[2].contract!.maxClaim,
                        '10000000000000000',
                        communities[2].contract!.baseInterval,
                        communities[2].contract!.incrementInterval,
                        '10000000000000000',
                        '100000000000000000',
                    ]
                );

                returnProposalsSubgraph.returns([data]);
                returnClaimedSubgraph.returns([]);
                returnCommunityEntities.returns([
                    {
                        id: communities[1].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                const result = await communityListService.list({
                    status: 'pending',
                });

                expect(result.rows[0]).to.include({
                    id: communities[1].id,
                    status: 'pending',
                });
            });

            it('should return pending communities with no open proposals (failed to found proposals in subgraph)', async () => {
                const communities = await CommunityFactory([
                    {
                        requestByAddress: users[0].address,
                        started: new Date(),
                        status: 'pending',
                        visibility: 'public',
                        contract: {
                            baseInterval: 60 * 60 * 24,
                            claimAmount: '1000000000000000000',
                            communityId: 0,
                            incrementInterval: 5 * 60,
                            maxClaim: '450000000000000000000',
                        },
                        hasAddress: true,
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                    {
                        requestByAddress: users[1].address,
                        started: new Date(),
                        status: 'pending',
                        visibility: 'public',
                        contract: {
                            baseInterval: 60 * 60 * 24,
                            claimAmount: '1000000000000000000',
                            communityId: 0,
                            incrementInterval: 5 * 60,
                            maxClaim: '450000000000000000000',
                        },
                        hasAddress: true,
                        gps: {
                            latitude: -23.4378873,
                            longitude: -46.4841214,
                        },
                    },
                ]);

                returnProposalsSubgraph.returns([]);
                returnClaimedSubgraph.returns([]);
                returnCommunityEntities.returns([
                    {
                        id: communities[0].contractAddress,
                        beneficiaries: 0,
                    },
                    {
                        id: communities[1].contractAddress,
                        beneficiaries: 0,
                    },
                ]);

                const pending = await communityListService.list({
                    status: 'pending',
                });

                expect(pending.count).to.be.equal(2);
            });
        });
    });
});
