import { expect } from 'chai';
import { ethers } from 'ethers';
import faker from 'faker';
import { Sequelize } from 'sequelize';
import Sinon, { assert, replace, spy, stub, SinonStub, restore } from 'sinon';

import { models, sequelize as database } from '../../src/database';
import { AppMediaContent } from '../../src/interfaces/app/appMediaContent';
import { AppUser } from '../../src/interfaces/app/appUser';
import { UbiPromoter } from '../../src/interfaces/ubi/ubiPromoter';
import { CommunityContentStorage } from '../../src/services/storage';
import BeneficiaryService from '../../src/services/ubi/beneficiary';
import CommunityService from '../../src/services/ubi/community';
import ManagerService from '../../src/services/ubi/managers';
import * as subgraph from '../../src/subgraph/queries/community';
import { sequelizeSetup, truncate } from '../config/sequelizeSetup';
import { randomTx } from '../config/utils';
import BeneficiaryFactory from '../factories/beneficiary';
import CommunityFactory from '../factories/community';
import ManagerFactory from '../factories/manager';
import UserFactory from '../factories/user';

// in this test there are users being assined with suspicious activity and others being removed
describe('community service', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communityContentStorageDelete: Sinon.SinonSpy<[number], Promise<void>>;
    let returnProposalsSubgraph: SinonStub;
    let returnClaimedSubgraph: SinonStub;
    let returnCommunityStateSubgraph: SinonStub;

    type SubgraphClaimed = { id: string; claimed: number }[];

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

        communityContentStorageDelete = spy(
            CommunityContentStorage.prototype,
            'deleteContent'
        );

        returnProposalsSubgraph = stub(subgraph, 'getCommunityProposal');
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

    after(() => {
        restore();
    });

    describe('list', () => {
        afterEach(async () => {
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize);
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

                returnClaimedSubgraph.returns([
                    {
                        id: communities[0].contractAddress,
                        claimed: 0,
                    },
                ]);

                const result = await CommunityService.list({
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

                returnClaimedSubgraph.returns([
                    {
                        id: communities[0].contractAddress,
                        claimed: 0,
                    },
                ]);

                const result = await CommunityService.list({
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

                returnClaimedSubgraph.returns([
                    {
                        id: communities[0].contractAddress,
                        claimed: 0,
                    },
                ]);

                const result = await CommunityService.list({
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

                returnClaimedSubgraph.returns([
                    {
                        id: communities[0].contractAddress,
                        claimed: 0,
                    },
                ]);

                const result = await CommunityService.list({
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

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await CommunityService.list({
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

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await CommunityService.list({});

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

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await CommunityService.list({ country: 'PT' });

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

                returnClaimedSubgraph.returns(
                    communities.map((community) => ({
                        id: community.contractAddress!,
                        claimed: 0,
                    }))
                );

                const result = await CommunityService.list({
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

            returnClaimedSubgraph.returns(claimed);

            //

            const result: any[] = [];

            for (let index = 0; index < totalCommunities / 5; index++) {
                const r = await CommunityService.list({
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

            returnClaimedSubgraph.returns(claimed);

            //
            const r = await CommunityService.list({
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

                const result = await CommunityService.list({});

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

                const result = await CommunityService.list({
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

                const result = await CommunityService.list({
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

                const result = await CommunityService.list({
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

                const result = await CommunityService.list({
                    fields: 'id;publicId;contract.maxClaim;contract.claimAmount',
                });

                expect(result.rows[0]).to.have.deep.keys([
                    'id',
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

                const result = await CommunityService.list({
                    fields: 'id;publicId;contract.maxClaim;proposal.*',
                });

                expect(result.rows[0]).to.have.deep.keys([
                    'id',
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

                const result = await CommunityService.list({
                    fields: '*;contract.*',
                });

                expect(result.rows[0]).to.have.deep.keys([
                    'city',
                    'contract',
                    'contractAddress',
                    'country',
                    'coverImage',
                    'coverMediaId',
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

                const result = await CommunityService.list({
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

                const result = await CommunityService.list({
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

                const pending = await CommunityService.list({
                    status: 'pending',
                });

                expect(pending.count).to.be.equal(2);
            });
        });
    });

    describe('campaign', () => {
        let communityId: number;
        before(async () => {
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
            communityId = communities[0].id;
        });

        after(async () => {
            await truncate(sequelize, 'Community');
            await truncate(sequelize);
        });

        it('community without campaign', async () => {
            const result = await CommunityService.getCampaign(communityId);
            // eslint-disable-next-line no-unused-expressions
            expect(result).to.be.null;
        });

        it('community with campaign', async () => {
            const campaignUrl = faker.internet.url();
            await sequelize.models.UbiCommunityCampaignModel.create({
                communityId,
                campaignUrl,
            });

            const result = await CommunityService.getCampaign(communityId);
            // eslint-disable-next-line no-unused-expressions
            expect(result).to.not.be.null;
            expect(result).to.include({
                communityId,
                campaignUrl,
            });
        });
    });

    describe('count', () => {
        describe('by country', () => {
            afterEach(async () => {
                await truncate(sequelize, 'Community');
            });

            it('full name', async () => {
                await CommunityFactory([
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

                const result = await CommunityService.count('country');

                (expect(result).to as any).containSubset([
                    {
                        country: 'PT',
                        count: '2',
                    },
                    {
                        country: 'ES',
                        count: '1',
                    },
                ]);
            });
        });
    });

    describe('edit', () => {
        afterEach(async () => {
            await truncate(sequelize, 'Manager');
            await truncate(sequelize);
        });

        it('without media', async () => {
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

            const communityNewDescription =
                'bla bla bla, this community to the moon!';
            const updatedCommunity = await CommunityService.edit(
                communities[0].id,
                {
                    currency: communities[0].currency,
                    description: communityNewDescription,
                    name: communities[0].name,
                    coverMediaId: -1,
                }
            );

            expect(updatedCommunity.description).to.be.equal(
                communityNewDescription
            );

            assert.callCount(communityContentStorageDelete, 0);
            expect(updatedCommunity.coverMediaId).to.not.be.equal(-1);
            expect(updatedCommunity.coverMediaId).to.be.equal(
                communities[0].coverMediaId
            );
        });

        it('with media', async () => {
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

            const communityNewDescription =
                'bla bla bla, this community to the moon!';
            const updatedCommunity = await CommunityService.edit(
                communities[0].id,
                {
                    currency: communities[0].currency,
                    description: communityNewDescription,
                    name: communities[0].name,
                    coverMediaId: 1,
                }
            );

            expect(updatedCommunity.description).to.be.equal(
                communityNewDescription
            );

            assert.callCount(communityContentStorageDelete, 1);
            expect(updatedCommunity.coverMediaId).to.not.be.equal(
                communities[0].coverMediaId
            );
            expect(updatedCommunity.coverMediaId).to.be.equal(1);
        });

        it('update email', async () => {
            const manager = await UserFactory({ n: 1 });

            const communities = await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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

            await ManagerFactory([manager[0]], communities[0].id);

            const communityNewDescription =
                'bla bla bla, this community to the moon!';
            const updatedCommunity = await CommunityService.edit(
                communities[0].id,
                {
                    currency: communities[0].currency,
                    description: communityNewDescription,
                    name: communities[0].name,
                    coverMediaId: 1,
                    email: 'test@gmail.com',
                },
                manager[0].address
            );

            expect(updatedCommunity.description).to.be.equal(
                communityNewDescription
            );
            expect(updatedCommunity.coverMediaId).to.be.equal(1);
            expect(updatedCommunity.email).to.be.equal('test@gmail.com');
        });
    });

    describe('edit pending community', () => {
        afterEach(async () => {
            await truncate(sequelize, 'Manager');
            await truncate(sequelize);
        });

        it('edit community without media and contract', async () => {
            const manager = await UserFactory({ n: 1 });

            await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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
                },
            ]);

            const result = await CommunityService.editSubmission({
                requestByAddress: manager[0].address,
                name: 'new name',
                description: 'new description',
                language: 'pt',
                currency: 'USD',
                city: 'São Paulo',
                country: 'Brasil',
                gps: {
                    latitude: 10,
                    longitude: 10,
                },
                email: 'test@email.com',
            });

            expect(result).to.include({
                name: 'new name',
                description: 'new description',
                language: 'pt',
                currency: 'USD',
                city: 'São Paulo',
                country: 'Brasil',
            });
        });

        it('should return error when a community is not pending', async () => {
            const manager = await UserFactory({ n: 1 });

            await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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

            CommunityService.editSubmission({
                requestByAddress: manager[0].address,
                name: 'new name',
                description: 'new description',
                language: 'pt',
                currency: 'USD',
                city: 'São Paulo',
                country: 'Brasil',
                gps: {
                    latitude: 10,
                    longitude: 10,
                },
                email: 'test@email.com',
            })
                .catch((e) => expect(e.name).to.be.equal('COMMUNITY_NOT_FOUND'))
                .then(() => {
                    throw new Error(
                        "'fails to welcome not existing account' expected to fail"
                    );
                });
        });

        it('edit community and contract', async () => {
            const manager = await UserFactory({ n: 1 });

            await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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
                },
            ]);

            const result = await CommunityService.editSubmission({
                requestByAddress: manager[0].address,
                name: 'new name',
                description: 'new description',
                language: 'pt',
                currency: 'USD',
                city: 'São Paulo',
                country: 'Brasil',
                gps: {
                    latitude: 10,
                    longitude: 10,
                },
                email: 'test@email.com',
                contractParams: {
                    baseInterval: 60 * 60 * 24 * 7,
                    claimAmount: '5000000000000000000',
                    incrementInterval: 5 * 60 * 60,
                    maxClaim: '500000000000000000000',
                },
            });

            expect(result).to.include({
                name: 'new name',
                description: 'new description',
                language: 'pt',
                currency: 'USD',
                city: 'São Paulo',
                country: 'Brasil',
            });
            expect(result.contract).to.include({
                baseInterval: 60 * 60 * 24 * 7,
                claimAmount: '5000000000000000000',
                incrementInterval: 5 * 60 * 60,
                maxClaim: '500000000000000000000',
            });
        });

        it('edit community and cover media', async () => {
            const manager = await UserFactory({ n: 1 });

            await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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
                },
            ]);

            const media = await models.appMediaContent.create({
                url: 'test.com',
                width: 0,
                height: 0,
            });

            const result = await CommunityService.editSubmission({
                requestByAddress: manager[0].address,
                name: 'new name',
                description: 'new description',
                language: 'pt',
                currency: 'USD',
                city: 'São Paulo',
                country: 'Brasil',
                gps: {
                    latitude: 10,
                    longitude: 10,
                },
                email: 'test@email.com',
                coverMediaId: media.id,
            });

            expect(result).to.include({
                name: 'new name',
                description: 'new description',
                language: 'pt',
                currency: 'USD',
                city: 'São Paulo',
                country: 'Brasil',
                coverMediaId: media.id,
            });
        });
    });

    describe('promoter', () => {
        afterEach(async () => {
            await truncate(sequelize, 'UbiPromoterModel');
            await truncate(sequelize);
        });

        it('get promoter', async () => {
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

            const createdMedia =
                await sequelize.models.AppMediaContentModel.create({
                    url: faker.image.imageUrl(),
                    width: 0,
                    height: 0,
                });

            const name = faker.company.companyName();
            const description = faker.lorem.sentence();
            const media = createdMedia.toJSON() as AppMediaContent;
            const createdPromoter =
                await sequelize.models.UbiPromoterModel.create({
                    category: 'organization',
                    name,
                    description,
                    logoMediaId: media.id, // on purpose
                });

            const promoter = createdPromoter.toJSON() as UbiPromoter;
            await sequelize.models.UbiCommunityPromoterModel.create({
                promoterId: promoter.id,
                communityId: communities[0].id,
            });
            const result: UbiPromoter | null =
                await CommunityService.getPromoter(communities[0].id);
            // eslint-disable-next-line no-unused-expressions
            expect(result).to.not.be.null;
            expect(result!.name).to.be.equal(name);
            expect(result!.description).to.be.equal(description);
        });
    });

    describe('find', () => {
        afterEach(async () => {
            await truncate(sequelize, 'Manager');
            await truncate(sequelize);
        });

        it('find by id - manager request', async () => {
            const manager = await UserFactory({ n: 1 });

            const communities = await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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

            await ManagerFactory([manager[0]], communities[0].id);

            const result = await CommunityService.findById(
                communities[0].id,
                manager[0].address
            );

            expect(result.publicId).to.be.equal(communities[0].publicId);
            expect(result.email).to.be.equal(communities[0].email);
        });

        it('find by id - common user request', async () => {
            const manager = await UserFactory({ n: 1 });

            const communities = await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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

            await ManagerFactory([manager[0]], communities[0].id);

            const result = await CommunityService.findById(communities[0].id);

            expect(result.publicId).to.be.equal(communities[0].publicId);
            expect(result.email).to.be.equal('');
        });

        it('find by Contract Address - manager request', async () => {
            const manager = await UserFactory({ n: 1 });

            const communities = await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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

            await ManagerFactory([manager[0]], communities[0].id);

            const result = await CommunityService.findByContractAddress(
                communities[0].contractAddress!,
                manager[0].address
            );

            expect(result.publicId).to.be.equal(communities[0].publicId);
            expect(result.email).to.be.equal(communities[0].email);
        });

        it('find by Contract Address - common user request', async () => {
            const manager = await UserFactory({ n: 1 });

            const communities = await CommunityFactory([
                {
                    requestByAddress: manager[0].address,
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

            await ManagerFactory([manager[0]], communities[0].id);

            const result = await CommunityService.findByContractAddress(
                communities[0].contractAddress!
            );

            expect(result.publicId).to.be.equal(communities[0].publicId);
            expect(result.email).to.be.equal('');
        });
    });

    describe('get manager', () => {
        afterEach(async () => {
            await truncate(sequelize, 'Manager');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'Community');
            await truncate(sequelize);
        });

        it('should return a list of added beneficiaries by current managers', async () => {
            const users = await UserFactory({ n: 4 });
            const community = await CommunityFactory([
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

            const tx = randomTx();
            const tx2 = randomTx();

            await ManagerFactory(users.slice(0, 2), community[0].id);
            await Promise.all([
                BeneficiaryService.add(
                    users[2].address,
                    users[0].address,
                    community[0].id,
                    tx,
                    new Date()
                ),
                BeneficiaryService.add(
                    users[3].address,
                    users[0].address,
                    community[0].id,
                    tx2,
                    new Date()
                ),
            ]);

            const managers = await CommunityService.getManagers(
                community[0].id
            );

            managers.forEach((manager) => {
                if (manager.address === users[0].address) {
                    expect(manager.added).to.be.equal(2);
                } else {
                    expect(manager.added).to.be.equal(0);
                }
            });
        });

        it('should return a list of added beneficiaries by previous managers (existing accounts but not managers)', async () => {
            const users = await UserFactory({ n: 4 });
            const community = await CommunityFactory([
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

            const tx = randomTx();

            await ManagerFactory(users.slice(0, 2), community[0].id);
            await BeneficiaryService.add(
                users[2].address,
                users[0].address,
                community[0].id,
                tx,
                new Date()
            );

            await ManagerService.remove(users[0].address, community[0].id);

            const managers = await CommunityService.getManagers(
                community[0].id,
                false
            );

            expect(managers[0].added).to.be.equal(1);
            // eslint-disable-next-line no-unused-expressions
            expect(managers[0].isDeleted).to.be.false;
        });

        it('should return a manager from a pending community', async () => {
            const users = await UserFactory({ n: 1 });
            const community = await CommunityFactory([
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
                },
            ]);

            const managers = await CommunityService.getManagers(
                community[0].id
            );

            expect(managers[0].added).to.be.equal(0);
            expect(managers[0].isDeleted).to.be.false;
            expect(managers[0].user).to.exist;
            expect(managers[0].address).to.not.exist;
        });
    });

    describe('delete submission pending', () => {
        afterEach(async () => {
            await truncate(sequelize, 'Manager');
            await truncate(sequelize, 'Beneficiary');
            await truncate(sequelize, 'Community');
            await truncate(sequelize);
        });

        it('should delete a community submission if pending', async () => {
            const users = await UserFactory({ n: 1 });
            const community = await CommunityFactory([
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
                },
            ]);

            const result = await CommunityService.deleteSubmission(
                users[0].address
            );
            CommunityService.findById(community[0].id)
                .catch((e) => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(result).to.be.true;
                    expect(e.name).to.be.equal('COMMUNITY_NOT_FOUND');
                })
                .then(() => {
                    throw new Error('expected to fail');
                });
        });

        it('should return an error when the user does not have a pending submission', async () => {
            const users = await UserFactory({ n: 2 });
            await CommunityFactory([
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

            CommunityService.deleteSubmission(users[0].address)
                .catch((e) => {
                    expect(e.name).to.be.equal('SUBMISSION_NOT_FOUND');
                })
                .then(() => {
                    throw new Error('expected to fail');
                });
        });
    });
});
