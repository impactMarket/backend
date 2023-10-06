import { Sequelize } from 'sequelize';
import { SinonSpy, SinonStub, assert, spy, stub } from 'sinon';
import { expect } from 'chai';

import { AppUser } from '../../src/interfaces/app/appUser';
import { CommunityAttributes } from '../../src/interfaces/ubi/community';
import { models } from '../../src/database';
import { sequelizeSetup, truncate } from '../config/sequelizeSetup';
import ClaimLocationService from '../../src/services/ubi/claimLocation/index';
import CommunityFactory from '../factories/community';
import UserFactory from '../factories/user';

describe('claim location service', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communities: CommunityAttributes[];
    let spyClaimLocationAdd: SinonSpy;
    let returnGetBeneficiaryByAddressSubgraph: SinonStub;
    const claimLocationService = new ClaimLocationService();

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        users = await UserFactory({ n: 4 });
        communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: 1,
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim: 450
                },
                hasAddress: true,
                country: 'BR'
            },
            {
                requestByAddress: users[1].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: 1,
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim: 450
                },
                hasAddress: true
            },
            {
                requestByAddress: users[2].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: 1,
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim: 450
                },
                hasAddress: true,
                country: 'PT'
            },
            {
                requestByAddress: users[3].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: 1,
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim: 450
                },
                hasAddress: true,
                country: 'AR'
            }
        ]);
        spyClaimLocationAdd = spy(models.ubiClaimLocation, 'create');
    });

    after(async () => {
        await truncate(sequelize, 'community');
        await truncate(sequelize);
        spyClaimLocationAdd.restore();
    });

    describe('add claim location', () => {
        it('should add claim location', async () => {
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: users[0].address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[0].contractAddress
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0
                }
            ]);

            await claimLocationService.add(
                communities[0].id,
                {
                    latitude: -22.2375236,
                    longitude: -49.9819737
                },
                users[0].address
            );

            assert.callCount(spyClaimLocationAdd, 1);
            assert.calledWith(spyClaimLocationAdd.getCall(0), {
                communityId: communities[0].id,
                gps: {
                    latitude: -22.2375236,
                    longitude: -49.9819737
                }
            });
        });

        it('should return an error when a user is claiming from a location different of the community', async () => {
            claimLocationService
                .add(
                    communities[2].id,
                    {
                        latitude: -22.2375236,
                        longitude: -49.9819737
                    },
                    users[0].address
                )
                .catch(e => expect(e.name).to.be.equal('INVALID_LOCATION'))
                .then(() => {
                    throw new Error('expected to fail');
                });
        });

        it('should add claim location when a user is claiming from a country neighbor', async () => {
            spyClaimLocationAdd.resetHistory();
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: users[3].address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[3].contractAddress
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0
                }
            ]);
            await claimLocationService.add(
                communities[3].id,
                {
                    latitude: -22.2375236,
                    longitude: -49.9819737
                },
                users[3].address
            );
            assert.callCount(spyClaimLocationAdd, 1);
            assert.calledWith(spyClaimLocationAdd.getCall(0), {
                communityId: communities[3].id,
                gps: {
                    latitude: -22.2375236,
                    longitude: -49.9819737
                }
            });
        });

        it('should return an error when a user is not a beneficiary', async () => {
            claimLocationService
                .add(
                    communities[0].id,
                    {
                        latitude: -22.2375236,
                        longitude: -49.9819737
                    },
                    users[2].address
                )
                .catch(e => expect(e.name).to.be.equal('NOT_BENEFICIARY'))
                .then(() => {
                    throw new Error('expected to fail');
                });
        });

        it('should return an error when a user does not belong to the community', async () => {
            claimLocationService
                .add(
                    communities[0].id,
                    {
                        latitude: -22.2375236,
                        longitude: -49.9819737
                    },
                    users[2].address
                )
                .catch(e => {
                    expect(e.name).to.be.equal('NOT_ALLOWED');
                })
                .then(() => {
                    throw new Error('expected to fail');
                });
        });
    });
});
