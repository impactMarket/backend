import { expect } from 'chai';
import { Op, Sequelize } from 'sequelize';
import Sinon, { assert, replace, spy, match } from 'sinon';

import { models } from '../../../src/database';
import { CommunityAttributes } from '../../../src/database/models/ubi/community';
import { AppUser } from '../../../src/interfaces/app/appUser';
import { StoryContentStorage } from '../../../src/services/storage';
import StoryService from '../../../src/services/story';
import BeneficiaryFactory from '../../factories/beneficiary';
import CommunityFactory from '../../factories/community';
import StoryFactory from '../../factories/story';
import UserFactory from '../../factories/user';
import truncate, { sequelizeSetup } from '../../utils/sequelizeSetup';

describe('story service', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communities: CommunityAttributes[];
    let storyContentStorageDeleteBulk: Sinon.SinonSpy<
        [number[]],
        Promise<void>
    >;
    let storyContentDestroy: Sinon.SinonSpy<any, Promise<number>>;
    let storyContentAdd: Sinon.SinonSpy;
    let community1: any;
    let community2: any;
    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        replace(
            StoryContentStorage.prototype,
            'deleteBulkContent',
            async (mediaId: number[]) => {
                await models.appMediaContent.destroy({
                    where: { id: mediaId },
                });
            }
        );
        storyContentStorageDeleteBulk = spy(
            StoryContentStorage.prototype,
            'deleteBulkContent'
        );
        storyContentDestroy = spy(models.storyContent, 'destroy');
        storyContentAdd = spy(models.storyContent, 'create');

        users = await UserFactory({ n: 6 });
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
                requestByAddress: users[3].address,
                started: new Date(),
                status: 'valid',
                visibility: 'private',
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
        community1 = {
            ...communities[0],
            contract: {
                baseInterval: 60 * 60 * 24,
                claimAmount: '1000000000000000000',
                communityId: 0,
                incrementInterval: 5 * 60,
                maxClaim: '450000000000000000000',
            },
        };
        await BeneficiaryFactory(users.slice(0, 3), community1.publicId);
        community2 = {
            ...communities[0],
            contract: {
                baseInterval: 60 * 60 * 24,
                claimAmount: '1000000000000000000',
                communityId: 0,
                incrementInterval: 5 * 60,
                maxClaim: '450000000000000000000',
            },
        };
        await BeneficiaryFactory(users.slice(3, 6), community2.publicId);
    });

    after(async () => {
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize, 'StoryContentModel');
        await truncate(sequelize);
        await storyContentStorageDeleteBulk.restore();
        await storyContentDestroy.restore();
    });

    describe('delete', () => {
        afterEach(async () => {
            await truncate(sequelize, 'StoryContentModel');
            await storyContentStorageDeleteBulk.resetHistory();
            await storyContentDestroy.resetHistory();
        });
        it('no stories to delete', async () => {
            const storyService = new StoryService();
            await storyService.deleteOlderStories();
            assert.callCount(storyContentStorageDeleteBulk, 0);
        });
        it('not enough stories to delete (all communities)', async () => {
            await StoryFactory([
                {
                    address: users[0].address,
                    communityId: community1.id,
                    postedAt: new Date(),
                },
            ]);
            //
            const storyService = new StoryService();
            await storyService.deleteOlderStories();
            assert.callCount(storyContentStorageDeleteBulk, 0);
            assert.callCount(storyContentDestroy, 0);
        });
        it('not enough stories to delete (too recent)', async () => {
            await StoryFactory([
                {
                    address: users[0].address,
                    communityId: community1.id,
                    postedAt: new Date(),
                },
                {
                    address: users[1].address,
                    communityId: community1.id,
                    postedAt: new Date(),
                },
                {
                    address: users[3].address,
                    communityId: community2.id,
                    postedAt: new Date(),
                },
            ]);
            //
            const storyService = new StoryService();
            await storyService.deleteOlderStories();
            assert.callCount(storyContentStorageDeleteBulk, 0);
            assert.callCount(storyContentDestroy, 0);
        });
        it('not enough stories to delete (some communities)', async () => {
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 32);
            await StoryFactory([
                {
                    address: users[0].address,
                    communityId: community1.id,
                    postedAt: tenDaysAgo,
                    media: true,
                },
                {
                    address: users[1].address,
                    communityId: community1.id,
                    postedAt: tenDaysAgo,
                },
                {
                    address: users[1].address,
                    communityId: community1.id,
                    postedAt: new Date(),
                },
                {
                    address: users[3].address,
                    communityId: community2.id,
                    postedAt: new Date(),
                },
            ]);
            //
            const storyService = new StoryService();
            await storyService.deleteOlderStories();
            assert.callCount(storyContentStorageDeleteBulk, 1);
            assert.callCount(storyContentDestroy, 1);
        });
        it('delete older stories', async () => {
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 32);
            const stories = await StoryFactory([
                {
                    address: users[0].address,
                    communityId: community1.id,
                    postedAt: tenDaysAgo,
                    media: true,
                },
                {
                    address: users[1].address,
                    communityId: community1.id,
                    postedAt: new Date(),
                },
                {
                    address: users[3].address,
                    communityId: community2.id,
                    postedAt: tenDaysAgo,
                },
                {
                    address: users[4].address,
                    communityId: community2.id,
                    postedAt: new Date(),
                },
            ]);
            //
            const storyService = new StoryService();
            await storyService.deleteOlderStories();
            assert.callCount(storyContentStorageDeleteBulk, 1);
            assert.callCount(storyContentDestroy, 1);
            assert.calledWith(storyContentDestroy, {
                where: {
                    id: {
                        [Op.in]: [stories[0].id, stories[2].id],
                    },
                },
            });
            assert.calledWith(storyContentStorageDeleteBulk, [
                stories[0].mediaMediaId!, // not null
            ]);
        });
    });

    describe('add', () => {
        afterEach(async () => {
            await truncate(sequelize, 'StoryContentModel');
            storyContentAdd.resetHistory();
        });

        it('add story', async () => {
            storyContentAdd.resetHistory();
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
