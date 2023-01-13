import { use, expect } from 'chai';
import chaiSubset from 'chai-subset';
import { Sequelize, Op } from 'sequelize';
import {
    assert,
    spy,
    replace,
    restore,
    SinonSpy,
    SinonStub,
    stub,
} from 'sinon';
import tk from 'timekeeper';

import { models, sequelize as database } from '../../src/database';
import { ManagerAttributes } from '../../src/database/models/ubi/manager';
import { AppUser } from '../../src/interfaces/app/appUser';
import { BeneficiaryAttributes } from '../../src/interfaces/ubi/beneficiary';
import { CommunityAttributes } from '../../src/interfaces/ubi/community';
import { UbiBeneficiaryRegistryType } from '../../src/interfaces/ubi/ubiBeneficiaryRegistry';
import UserService from '../../src/services/app/user';
import { IListBeneficiary } from '../../src/services/endpoints';
import BeneficiaryService from '../../src/services/ubi/beneficiary';
import * as beneficiarySubgraph from '../../src/subgraph/queries/beneficiary';
import * as subgraph from '../../src/subgraph/queries/community';
import * as userSubgraph from '../../src/subgraph/queries/user';
import { sequelizeSetup, truncate } from '../config/sequelizeSetup';
import { jumpToTomorrowMidnight, randomTx } from '../config/utils';
import BeneficiaryFactory from '../factories/beneficiary';
import CommunityFactory from '../factories/community';
import ManagerFactory from '../factories/manager';
import UserFactory from '../factories/user';

use(chaiSubset);

// in this test there are users being assined with suspicious activity and others being removed
describe('beneficiary service', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communities: CommunityAttributes[];
    let beneficiaries: BeneficiaryAttributes[];

    let spyBeneficiaryRegistryAdd: SinonSpy;
    let spyBeneficiaryAdd: SinonSpy;
    let spyBeneficiaryUpdate: SinonSpy;
    let returnCommunityStateSubgraph: SinonStub;
    let returnBeneficiaryActivitiesSubgraph: SinonStub;
    let returnGetBeneficiarySubgraph: SinonStub;
    let returnGetBeneficiaryByAddressSubgraph: SinonStub;

    const decreaseStep = 1;
    const maxClaim = 450;

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        users = await UserFactory({ n: 24 });
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
                    maxClaim,
                },
                hasAddress: true,
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
                    maxClaim,
                    decreaseStep,
                },
                hasAddress: true,
            },
        ]);
        beneficiaries = await BeneficiaryFactory(
            users.slice(0, 8),
            communities[0].id
        );

        spyBeneficiaryRegistryAdd = spy(
            models.ubiBeneficiaryRegistry,
            'create'
        );
        spyBeneficiaryAdd = spy(models.beneficiary, 'create');
        spyBeneficiaryUpdate = spy(models.beneficiary, 'update');
        replace(database, 'query', sequelize.query);
        returnCommunityStateSubgraph = stub(subgraph, 'getCommunityState');
        returnBeneficiaryActivitiesSubgraph = stub(
            userSubgraph,
            'getUserActivity'
        );
        returnGetBeneficiarySubgraph = stub(
            beneficiarySubgraph,
            'getBeneficiaries'
        );
        returnGetBeneficiaryByAddressSubgraph = stub(
            beneficiarySubgraph,
            'getBeneficiariesByAddress'
        );
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

    after(async () => {
        // this two has to come first!
        await truncate(sequelize, 'Manager');
        await truncate(sequelize, 'UbiBeneficiaryRegistryModel');
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize);
        //
        spyBeneficiaryAdd.restore();
        spyBeneficiaryRegistryAdd.restore();
        restore();
    });

    it('add to public community', async () => {
        spyBeneficiaryAdd.resetHistory();
        spyBeneficiaryRegistryAdd.resetHistory();
        // add
        const tx = randomTx();
        const txAt = new Date();
        await BeneficiaryService.add(
            users[15].address,
            users[0].address,
            communities[0].id,
            tx,
            txAt
        );

        //
        assert.callCount(spyBeneficiaryAdd, 1);
        assert.calledWith(spyBeneficiaryAdd.getCall(0), {
            address: users[15].address,
            communityId: communities[0].id,
            tx,
            txAt,
        });
        //
        assert.callCount(spyBeneficiaryRegistryAdd, 1);
        assert.calledWith(spyBeneficiaryRegistryAdd.getCall(0), {
            address: users[15].address,
            from: users[0].address,
            communityId: communities[0].id,
            activity: UbiBeneficiaryRegistryType.add,
            tx,
            txAt,
        });
    });

    it('remove from public community', async () => {
        spyBeneficiaryUpdate.resetHistory();
        spyBeneficiaryRegistryAdd.resetHistory();
        // add
        await BeneficiaryService.add(
            users[15].address,
            users[0].address,
            communities[0].id,
            randomTx(),
            new Date()
        );
        const tx = randomTx();
        const txAt = new Date();
        await BeneficiaryService.remove(
            users[15].address,
            users[0].address,
            communities[0].id,
            tx,
            txAt
        );

        //
        assert.callCount(spyBeneficiaryUpdate, 1);
        assert.calledWith(
            spyBeneficiaryUpdate.getCall(0),
            {
                active: false,
            },
            {
                where: {
                    address: users[15].address,
                    communityId: communities[0].id,
                },
            }
        );
        //
        assert.callCount(spyBeneficiaryRegistryAdd, 1);
        assert.calledWith(spyBeneficiaryRegistryAdd.getCall(0), {
            address: users[15].address,
            from: users[0].address,
            communityId: communities[0].id,
            activity: UbiBeneficiaryRegistryType.remove,
            tx,
            txAt,
        });
    });

    describe('filter on listing beneficiaries', () => {
        let listUsers: AppUser[];
        let listCommunity: CommunityAttributes[];
        let listManagers: ManagerAttributes[];

        before(async () => {
            listUsers = await UserFactory({ n: 5 });
            listCommunity = await CommunityFactory([
                {
                    requestByAddress: listUsers[0].address,
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
            ]);
            listManagers = await ManagerFactory(
                [listUsers[0]],
                listCommunity[0].id
            );
            beneficiaries = await BeneficiaryFactory(
                listUsers,
                listCommunity[0].id
            );
        });

        it('should list undefined beneficiaries', async () => {
            await sequelize.models.AppUserModel.update(
                { username: null },
                { where: { address: listUsers[2].address } }
            );

            const returnSubgraph: any = [];
            beneficiaries.forEach((beneficiary) => {
                returnSubgraph.push({
                    address: beneficiary.address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: listCommunity[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0,
                });
            });
            returnGetBeneficiarySubgraph.returns(returnSubgraph);

            const result = await BeneficiaryService.list(
                listManagers[0].address,
                0,
                5,
                { unidentified: true }
            );

            expect(result.length).to.be.equal(1);
            expect(result[0].address).to.be.equal(listUsers[2].address);
            // eslint-disable-next-line no-unused-expressions
            expect(result[0].username).to.be.null;
        });

        it('should list blocked beneficiaries', async () => {
            returnGetBeneficiarySubgraph.resetHistory();
            returnGetBeneficiarySubgraph.returns([
                {
                    address: listUsers[3].address,
                    claims: 0,
                    community: {
                        id: listCommunity[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 2,
                },
            ]);

            const result = await BeneficiaryService.list(
                listManagers[0].address,
                0,
                5,
                { blocked: true }
            );

            expect(result.length).to.be.equal(1);
            expect(result[0].address).to.be.equal(listUsers[3].address);
            // eslint-disable-next-line no-unused-expressions
            expect(result[0].blocked).to.be.true;
        });

        it('should list inactivity beneficiaries', async () => {
            const lastClaimAt = new Date();
            const interval = communities[0].contract!.baseInterval * 4;
            lastClaimAt.setSeconds(lastClaimAt.getSeconds() - interval);

            returnGetBeneficiarySubgraph.resetHistory();
            returnGetBeneficiarySubgraph.returns([
                {
                    address: listUsers[4].address,
                    claims: 0,
                    community: {
                        id: listCommunity[0].contractAddress,
                    },
                    lastClaimAt,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 2,
                },
            ]);

            const result = await BeneficiaryService.list(
                listManagers[0].address,
                0,
                5,
                { inactivity: true }
            );

            expect(result.length).to.be.equal(1);
            expect(result[0].address).to.be.equal(listUsers[4].address);
        });
    });

    describe('search', () => {
        it('by name (full)', async () => {
            const user = users[3];
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: user.address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0,
                },
            ]);

            const result: IListBeneficiary[] = await BeneficiaryService.search(
                users[0].address,
                user.username!
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by name (partially)', async () => {
            const user = users[4];
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: user.address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0,
                },
            ]);
            const result = await BeneficiaryService.search(
                users[0].address,
                user.username!.slice(0, user.username!.length / 2)
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by name (not case sensitive)', async () => {
            const user = users[5];
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: user.address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0,
                },
            ]);
            const result = await BeneficiaryService.search(
                users[0].address,
                user.username!.toUpperCase()
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by address (checksumed)', async () => {
            const user = users[6];
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: user.address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0,
                },
            ]);
            const result = await BeneficiaryService.search(
                users[0].address,
                user.address
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by address (not checksumed)', async () => {
            const user = users[7];
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: user.address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0,
                },
            ]);
            const result = await BeneficiaryService.search(
                users[0].address,
                user.address.toLowerCase()
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by non (beneficiary) existing address', async () => {
            const user = users[8];
            returnGetBeneficiaryByAddressSubgraph.returns([]);
            const result = await BeneficiaryService.search(
                users[0].address,
                user.address.toLowerCase()
            );
            expect(result.length).to.be.equal(0);
        });

        it('by non (beneficiary) existing name', async () => {
            const user = users[9];
            returnGetBeneficiaryByAddressSubgraph.returns([]);
            const result = await BeneficiaryService.search(
                users[0].address,
                user.username!.toUpperCase()
            );
            expect(result.length).to.be.equal(0);
        });

        it('get total beneficiaries', async () => {
            const user = await UserFactory({ n: 4 });
            const community = await CommunityFactory([
                {
                    requestByAddress: user[0].address,
                    started: new Date(),
                    status: 'valid',
                    visibility: 'public',
                    contract: {
                        baseInterval: 60 * 60 * 24,
                        claimAmount: 1,
                        communityId: 0,
                        incrementInterval: 5 * 60,
                        maxClaim,
                    },
                    hasAddress: true,
                },
            ]);

            await ManagerFactory([user[0]], community[0].id);

            await BeneficiaryFactory(user, community[0].id);

            await models.beneficiary.update(
                {
                    active: false,
                },
                {
                    where: {
                        address: {
                            [Op.in]: [user[1].address, user[2].address],
                        },
                    },
                }
            );
            returnCommunityStateSubgraph.resetHistory();
            returnCommunityStateSubgraph.returns({
                removedBeneficiaries: 2,
            });

            const total = await BeneficiaryService.getTotalBeneficiaries(
                user[0].address
            );

            expect(total.inactive).to.be.equal(2);
        });
    });

    describe.skip('beneficiary activity', () => {
        before(async () => {
            const tx = randomTx();

            await BeneficiaryService.add(
                users[16].address,
                users[0].address,
                communities[0].id,
                tx,
                new Date()
            );

            returnBeneficiaryActivitiesSubgraph.returns([
                {
                    id: tx,
                    by: users[0].address,
                    user: users[16].address,
                    community: {
                        id: communities[0].id,
                    },
                    activity: 'ADDED',
                    timestamp: (new Date().getTime() / 1000) | 0,
                },
            ]);

            tk.travel(jumpToTomorrowMidnight());
        });

        it('get all activities', async () => {
            const activities = await BeneficiaryService.getBeneficiaryActivity(
                users[0].address,
                users[16].address,
                'ALL',
                0,
                10
            );

            expect(activities[0]).to.include({
                type: 'transaction',
                amount: '50',
                isFromBeneficiary: false,
            });
            expect(activities[1]).to.include({
                type: 'transaction',
                amount: '25',
                isFromBeneficiary: true,
            });
            expect(activities[2]).to.include({
                type: 'claim',
                amount: '15',
            });
            expect(activities[3]).to.include({
                type: 'registry',
                activity: 0,
                withAddress: users[0].address,
                username: users[0].username,
            });
        });

        it('get claim activity', async () => {
            const activities = await BeneficiaryService.getBeneficiaryActivity(
                users[0].address,
                users[16].address,
                'claim',
                0,
                10
            );

            expect(activities[0]).to.include({
                type: 'claim',
                amount: '15',
            });
        });

        it('get registry activity', async () => {
            const activities = await BeneficiaryService.getBeneficiaryActivity(
                users[0].address,
                users[16].address,
                'registry',
                0,
                10
            );

            expect(activities[0]).to.include({
                type: 'registry',
                activity: 0,
                withAddress: users[0].address,
                username: users[0].username,
            });
        });

        it('get transaction activity', async () => {
            const activities = await BeneficiaryService.getBeneficiaryActivity(
                users[0].address,
                users[16].address,
                'transaction',
                0,
                10
            );

            expect(activities[0]).to.include({
                type: 'transaction',
                amount: '50',
                isFromBeneficiary: false,
            });
            expect(activities[1]).to.include({
                type: 'transaction',
                amount: '25',
                isFromBeneficiary: true,
            });
        });
    });

    describe('beneficiary rules', () => {
        before(async () => {
            const tx = randomTx();

            await BeneficiaryService.add(
                users[17].address,
                users[0].address,
                communities[0].id,
                tx,
                new Date()
            );
        });

        it('readRules should be false after a beneficiary has been added', async () => {
            returnGetBeneficiaryByAddressSubgraph.resetHistory();
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: users[17].address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0,
                },
            ]);

            const user = await UserService.welcome(users[17].address);

            // eslint-disable-next-line no-unused-expressions
            expect(user.beneficiary).to.be.not.null;
            expect(user.beneficiary).to.include({
                readRules: false,
                blocked: false,
                communityId: communities[0].id,
            });
        });

        it('should read the beneficiary rules successfully', async () => {
            returnGetBeneficiaryByAddressSubgraph.resetHistory();
            returnGetBeneficiaryByAddressSubgraph.returns([
                {
                    address: users[17].address.toLowerCase(),
                    claims: 0,
                    community: {
                        id: communities[0].contractAddress,
                    },
                    lastClaimAt: 0,
                    preLastClaimAt: 0,
                    since: 0,
                    claimed: 0,
                    state: 0,
                },
            ]);
            const readRules = await BeneficiaryService.readRules(
                users[17].address
            );
            const user = await UserService.welcome(users[17].address);

            // eslint-disable-next-line no-unused-expressions
            expect(readRules).to.be.true;
            // eslint-disable-next-line no-unused-expressions
            expect(user.beneficiary).to.be.not.null;
            expect(user.beneficiary).to.include({
                readRules: true,
                blocked: false,
                communityId: communities[0].id,
            });
        });
    });

    describe('survey', () => {
        it('should save a survey', async () => {
            const users = await UserFactory({ n: 1 });

            const result = await BeneficiaryService.saveSurvery(
                users[0].address,
                [
                    {
                        question: 1,
                        answer: 'answer',
                        surveyId: 1,
                    },
                ]
            );

            expect(result[0]).to.include({
                question: 1,
                answer: 'answer',
                surveyId: 1,
            });
        });

        it('should return an error with an invalid user', async () => {
            BeneficiaryService.saveSurvery('invalidAddress', [
                {
                    question: 1,
                    answer: 'answer',
                    surveyId: 1,
                },
            ])
                .catch((e) => expect(e.name).to.be.equal('USER_NOT_FOUND'))
                .then(() => {
                    throw new Error('expected to fail');
                });
        });
    });

    describe('maxClaim', () => {
        it('update max claim when add a beneficiary', async () => {
            await BeneficiaryService.add(
                users[18].address,
                users[1].address,
                communities[1].id,
                randomTx(),
                new Date()
            );

            await BeneficiaryService.add(
                users[19].address,
                users[1].address,
                communities[1].id,
                randomTx(),
                new Date()
            );

            const contractUpdated = await models.ubiCommunityContract.findOne({
                attributes: ['maxClaim'],
                where: { communityId: communities[1].id },
            });

            const newMaxClaim = maxClaim - decreaseStep * 2;
            expect(contractUpdated!.maxClaim).to.be.equal(newMaxClaim);
        });

        it('update max claim when remove a beneficiary', async () => {
            // reset maxClaim
            await models.ubiCommunityContract.update(
                {
                    maxClaim,
                },
                {
                    where: { communityId: communities[1].id },
                }
            );

            await BeneficiaryService.add(
                users[20].address,
                users[1].address,
                communities[1].id,
                randomTx(),
                new Date()
            );

            await BeneficiaryService.add(
                users[21].address,
                users[1].address,
                communities[1].id,
                randomTx(),
                new Date()
            );

            await BeneficiaryService.remove(
                users[20].address,
                users[1].address,
                communities[1].id,
                randomTx(),
                new Date()
            );

            const contractUpdated = await models.ubiCommunityContract.findOne({
                attributes: ['maxClaim'],
                where: { communityId: communities[1].id },
            });

            const newMaxClaim = maxClaim - decreaseStep * 1;
            expect(contractUpdated!.maxClaim).to.be.equal(newMaxClaim);
        });

        it('update max claim when a community does not have a decrease step', async () => {
            await BeneficiaryService.add(
                users[22].address,
                users[0].address,
                communities[0].id,
                randomTx(),
                new Date()
            );

            await BeneficiaryService.add(
                users[23].address,
                users[0].address,
                communities[0].id,
                randomTx(),
                new Date()
            );

            const contractUpdated = await models.ubiCommunityContract.findOne({
                attributes: ['maxClaim'],
                where: { communityId: communities[0].id },
            });

            expect(contractUpdated!.maxClaim).to.be.equal(maxClaim);
        });
    });
});
