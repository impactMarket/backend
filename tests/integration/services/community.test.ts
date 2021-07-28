import { expect } from 'chai';
import faker from 'faker';
import { Sequelize } from 'sequelize';

import { User } from '../../../src/interfaces/app/user';
import CommunityService from '../../../src/services/ubi/community';
import BeneficiaryFactory from '../../factories/beneficiary';
import CommunityFactory from '../../factories/community';
import UserFactory from '../../factories/user';
import truncate, { sequelizeSetup } from '../../utils/sequelizeSetup';

// in this test there are users being assined with suspicious activity and others being removed
describe('community service', () => {
    let sequelize: Sequelize;
    let users: User[];
    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
        users = await UserFactory({ n: 3 });
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
        });

        it('by country', async () => {
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

            await truncate(sequelize, 'Community');
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

            for (const community of communities) {
                await BeneficiaryFactory(
                    await UserFactory({
                        n: Math.floor(Math.random() * 20),
                    }),
                    community.publicId
                );
            }

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
            expect(result).to.be.null;
        });

        it('community with campaign', async () => {
            const campaignUrl = faker.internet.url();
            await sequelize.models.UbiCommunityCampaignModel.create({
                communityId,
                campaignUrl,
            });

            const result = await CommunityService.getCampaign(communityId);
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
});
