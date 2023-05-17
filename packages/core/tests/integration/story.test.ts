import { expect } from 'chai';
import { Sequelize } from 'sequelize';
import Sinon, { assert, spy, match, SinonStub, stub } from 'sinon';

import { models } from '../../src/database';
import { AppUser } from '../../src/interfaces/app/appUser';
import { CommunityAttributes } from '../../src/interfaces/ubi/community';
import StoryService from '../../src/services/story';
import * as userSubgraph from '../../src/subgraph/queries/user';
import { sequelizeSetup, truncate } from '../config/sequelizeSetup';
import BeneficiaryFactory from '../factories/beneficiary';
import CommunityFactory from '../factories/community';
import UserFactory from '../factories/user';

describe('story service', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communities: CommunityAttributes[];
    let storyContentDestroy: Sinon.SinonSpy<any, Promise<number>>;
    let storyContentAdd: Sinon.SinonSpy;
    let returnUserRoleSubgraph: SinonStub;
    let community1: any;
    let community2: any;
    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        storyContentDestroy = spy(models.storyContent, 'destroy');
        storyContentAdd = spy(models.storyContent, 'create');
        returnUserRoleSubgraph = stub(userSubgraph, 'getUserRoles');

        users = await UserFactory({ n: 6 });
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
                    maxClaim: 450,
                },
                hasAddress: true,
            },
            {
                requestByAddress: users[3].address,
                started: new Date(),
                status: 'valid',
                visibility: 'private',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: 1,
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim: 450,
                },
                hasAddress: true,
            },
        ]);
        community1 = {
            ...communities[0],
            contract: {
                baseInterval: 60 * 60 * 24,
                claimAmount: 1,
                communityId: 0,
                incrementInterval: 5 * 60,
                maxClaim: 450,
            },
        };
        await BeneficiaryFactory(users.slice(0, 3), community1.id);
        community2 = {
            ...communities[0],
            contract: {
                baseInterval: 60 * 60 * 24,
                claimAmount: 1,
                communityId: 0,
                incrementInterval: 5 * 60,
                maxClaim: 450,
            },
        };
        await BeneficiaryFactory(users.slice(3, 6), community2.id);
    });

    after(async () => {
        await truncate(sequelize, 'beneficiary');
        await truncate(sequelize, 'storyContent');
        await truncate(sequelize);
        await storyContentDestroy.restore();
        returnUserRoleSubgraph.restore();
    });

    describe('add', () => {
        afterEach(async () => {
            await truncate(sequelize, 'storyContent');
            storyContentAdd.resetHistory();
        });

        it('add story', async () => {
            storyContentAdd.resetHistory();
            returnUserRoleSubgraph.returns({
                beneficiary: {
                    community: community1.contractAddress,
                    state: 0,
                },
                manager: null,
            });
            const storyService = new StoryService();
            await storyService.add(users[0].address, {
                byAddress: users[0].address,
                communityId: community1.id,
            });
            assert.callCount(storyContentAdd, 1);
            assert.calledWith(storyContentAdd.getCall(0), {
                storyCommunity: [{ communityId: community1.id }],
                byAddress: users[0].address,
                isPublic: true,
                postedAt: match.any,
                storyEngagement: [],
            });
        });

        it('should return error when a community is private', async () => {
            const storyService = new StoryService();
            storyService
                .add(users[0].address, {
                    byAddress: users[0].address,
                    communityId: communities[1].id,
                })
                .catch((e) => expect(e.name).to.be.equal('PRIVATE_COMMUNITY'))
                .then(() => {
                    throw new Error('expected to fail');
                });
        });
    });
});
