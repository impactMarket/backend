import { Sequelize } from 'sequelize';
import Sinon, { stub } from 'sinon';

import { CommunityAttributes } from '../../../src/database/models/ubi/community';
import { User } from '../../../src/interfaces/app/user';
import { StoryContentStorage } from '../../../src/services/storage';
import StoryService from '../../../src/services/story';
import BeneficiaryFactory from '../../factories/beneficiary';
import CommunityFactory from '../../factories/community';
import UserFactory from '../../factories/user';
import truncate, { sequelizeSetup } from '../../utils/sequelizeSetup';

describe('story service', () => {
    let sequelize: Sequelize;
    let users: User[];
    let communities: CommunityAttributes[];
    let storyContentStorageDeleteBulk: Sinon.SinonStub<
        [number[]],
        Promise<void>
    >;
    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        storyContentStorageDeleteBulk = stub(
            StoryContentStorage.prototype,
            'deleteBulkContent'
        ).returns(new Promise(() => {}));

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
        const community1 = {
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
        const community2 = {
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
        await truncate(sequelize);
        await storyContentStorageDeleteBulk.restore();
    });

    describe('delete', () => {
        it('deletes older stories', async () => {
            const storyService = new StoryService();
            await storyService.deleteOlderStories();
        });
    });
});
