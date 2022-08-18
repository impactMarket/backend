import { database, interfaces, tests, services } from '@impactmarket/core';
import { expect } from 'chai';
import { ethers } from 'ethers';
import { Sequelize } from 'sequelize';
import { stub, assert, SinonStub } from 'sinon';

import * as beneficiarySubgraph from '../../../../core/src/subgraph/queries/beneficiary';
import * as managerSubgraph from '../../../../core/src/subgraph/queries/manager';
import { verifyDeletedAccounts } from '../../../src/jobs/cron/user';

describe('[jobs - cron] verifyDeletedAccounts', () => {
    let sequelize: Sequelize;
    let users: interfaces.app.appUser.AppUser[];
    let communities: interfaces.ubi.community.CommunityAttributes[];
    let dbGlobalDemographicsStub: SinonStub;
    const communityDemographicsService =
        new services.ubi.CommunityDemographicsService();
    let returnGetBeneficiaryByAddressSubgraph: SinonStub;
    let returnGetBeneficiarySubgraph: SinonStub;

    before(async () => {
        sequelize = tests.config.setup.sequelizeSetup();
        await sequelize.sync();

        dbGlobalDemographicsStub = stub(
            communityDemographicsService.ubiCommunityDemographics,
            'bulkCreate'
        );

        users = await tests.factories.UserFactory({
            n: 4,
            props: [
                {
                    gender: 'm',
                    year: 1990,
                },
                {
                    gender: 'f',
                    year: 1980,
                },
                {
                    gender: 'u',
                    year: 1970,
                },
                {
                    gender: 'u',
                    year: 1965,
                },
            ],
        });
        communities = await tests.factories.CommunityFactory([
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
        ]);
        await tests.factories.ManagerFactory([users[0]], communities[0].id);

        const randomWallet = ethers.Wallet.createRandom();
        const tx = tests.config.utils.randomTx();
        const tx2 = tests.config.utils.randomTx();
        const tx3 = tests.config.utils.randomTx();

        await services.ubi.BeneficiaryService.add(
            users[1].address,
            users[0].address,
            communities[0].id,
            tx,
            new Date()
        );

        await services.ubi.BeneficiaryService.add(
            users[2].address,
            users[0].address,
            communities[0].id,
            tx2,
            new Date()
        );

        await services.ubi.BeneficiaryService.add(
            users[3].address,
            users[0].address,
            communities[0].id,
            tx3,
            new Date()
        );

        await services.ubi.BeneficiaryService.addTransaction({
            beneficiary: users[1].address,
            withAddress: await randomWallet.getAddress(),
            amount: '25',
            isFromBeneficiary: true,
            tx,
            txAt: new Date(),
        });

        await services.ubi.ClaimService.add({
            address: users[1].address,
            communityId: communities[0].id,
            amount: '15',
            tx,
            txAt: new Date('2021-01-02'),
        });

        await services.ubi.InflowService.add(
            users[1].address,
            communities[0].publicId,
            '30',
            tx,
            new Date()
        );

        const storyService = new services.StoryService();
        const story = await storyService.add(users[0].address, {
            byAddress: users[0].address,
            communityId: communities[0].id,
        });
        await storyService.love(users[0].address, story.id);

        returnGetBeneficiaryByAddressSubgraph = stub(
            beneficiarySubgraph,
            'getBeneficiariesByAddress'
        );
        returnGetBeneficiarySubgraph = stub(
            beneficiarySubgraph,
            'getBeneficiaries'
        );
    });

    after(async () => {
        await tests.config.setup.truncate(sequelize, 'AppUserModel');
        await tests.config.setup.truncate(sequelize, 'Manager');
        await tests.config.setup.truncate(sequelize, 'Beneficiary');
        await tests.config.setup.truncate(sequelize, 'StoryCommunityModel');
        await tests.config.setup.truncate(sequelize);
    });

    it('should not delete a user before 15 days have passed', async () => {
        const date = new Date();
        date.setDate(date.getDate() - 14);

        await database.models.appUser.update(
            {
                deletedAt: date,
            },
            {
                where: {
                    address: users[2].address,
                },
            }
        );

        await verifyDeletedAccounts();

        const user = await database.models.appUser.findOne({
            where: {
                address: users[2].address,
            },
        });

        // eslint-disable-next-line no-unused-expressions
        expect(user).to.exist;
        expect(user).to.include({
            address: users[2].address,
            active: true,
        });
    });

    it('delete user/beneficiary', async () => {
        const date = new Date();
        date.setDate(date.getDate() - 16);

        await database.models.appUser.update(
            {
                deletedAt: date,
            },
            {
                where: {
                    address: users[1].address,
                },
            }
        );

        await verifyDeletedAccounts();

        const user = await database.models.appUser.findOne({
            where: {
                address: users[1].address,
            },
        });

        const beneficiary = await database.models.beneficiary.findOne({
            where: {
                address: users[1].address,
            },
        });

        const registry = (await database.models.ubiBeneficiaryRegistry.findOne({
            where: {
                address: users[1].address,
            },
        }))!.toJSON();

        const transactions =
            (await database.models.ubiBeneficiaryTransaction.findOne({
                where: {
                    beneficiary: users[1].address,
                },
            }))!.toJSON();

        const claims = (await database.models.ubiClaim.findOne({
            where: {
                address: users[1].address,
            },
        }))!.toJSON();

        const inflow = (await database.models.inflow.findOne({
            where: {
                from: users[1].address,
            },
        }))!.toJSON();

        // eslint-disable-next-line no-unused-expressions
        expect(user).to.be.null;
        expect(beneficiary).to.include({
            active: true,
        });
        expect(registry).to.include({
            activity: 0,
        });
        expect(transactions).to.include({
            amount: '25',
            isFromBeneficiary: true,
        });
        expect(claims).to.include({
            amount: '15',
        });
        expect(inflow).to.include({
            amount: '30',
        });
    });

    it('delete user/manager', async () => {
        const date = new Date();
        date.setDate(date.getDate() - 16);

        await database.models.appUser.update(
            {
                deletedAt: date,
            },
            {
                where: {
                    address: users[0].address,
                },
            }
        );

        await verifyDeletedAccounts();

        const user = await database.models.appUser.findOne({
            where: {
                address: users[0].address,
            },
        });

        const manager = await database.models.manager.findOne({
            where: {
                address: users[0].address,
            },
        });

        const findStoryContent = await database.models.storyContent.findOne({
            where: {
                byAddress: users[0].address,
            },
        });
        const findStoryUserEngagement =
            await database.models.storyUserEngagement.findOne({
                where: {
                    address: users[0].address,
                },
            });

        // eslint-disable-next-line no-unused-expressions
        expect(user).to.be.null;
        expect(manager).to.include({
            active: true,
        });
        // eslint-disable-next-line no-unused-expressions
        expect(findStoryContent).to.be.null;
        // eslint-disable-next-line no-unused-expressions
        expect(findStoryUserEngagement).to.be.null;
    });

    it('search beneficiary by address after delete user', async () => {
        returnGetBeneficiaryByAddressSubgraph.returns([
            {
                address: users[1].address.toLowerCase(),
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
        const beneficiary = await services.ubi.BeneficiaryService.search(
            users[0].address,
            users[1].address
        );
        expect(beneficiary[0]).to.include({
            address: users[1].address,
            username: null,
            isDeleted: true,
        });
    });
    it('search beneficiary by username after delete user', async () => {
        returnGetBeneficiaryByAddressSubgraph.returns([]);
        const beneficiary = await services.ubi.BeneficiaryService.search(
            users[0].address,
            users[1].username!
        );
        expect(beneficiary.length).to.be.equal(0);
    });

    it('list beneficiaries after delete user', async () => {
        returnGetBeneficiarySubgraph.returns([
            {
                address: users[1].address.toLowerCase(),
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
            {
                address: users[2].address.toLowerCase(),
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
            {
                address: users[3].address.toLowerCase(),
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
        const beneficiary = await services.ubi.BeneficiaryService.list(
            users[0].address,
            0,
            10,
            {
                active: true,
            }
        );

        beneficiary.forEach((el) => {
            if (el.address === users[1].address) {
                expect(el).to.include({
                    address: users[1].address,
                    username: null,
                    isDeleted: true, // deleted
                });
            } else if (el.address === users[2].address) {
                expect(el).to.include({
                    address: users[2].address,
                    username: users[2].username,
                    isDeleted: true, // target to be deleted
                });
            } else if (el.address === users[3].address) {
                expect(el).to.include({
                    address: users[3].address,
                    username: users[3].username,
                    isDeleted: false,
                });
            }
        });
    });

    it('get managers after delete user', async () => {
        const returnGetCommunityManagersSubgraph = stub(
            managerSubgraph,
            'getCommunityManagers'
        );
        returnGetCommunityManagersSubgraph.returns(
            Promise.resolve([
                {
                    address: users[0].address,
                    state: 0,
                    added: 0,
                    removed: 0,
                    since: 0,
                    until: 0,
                },
            ])
        );
        const manager = await services.ubi.CommunityService.getManagers(
            communities[0].id
        );
        expect(manager[0]).to.include({
            address: users[0].address,
            user: null,
            isDeleted: true,
        });
    });

    it('calculateCommunitiesDemographics after delete user (should ignore deleted users)', async () => {
        await communityDemographicsService.calculate();
        await tests.config.utils.waitForStubCall(dbGlobalDemographicsStub, 1);
        const yesterdayDateOnly = new Date();
        yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);
        const yesterdayDate = yesterdayDateOnly.toISOString().split('T')[0];
        assert.calledWith(dbGlobalDemographicsStub.getCall(0), [
            {
                communityId: communities[0].id,
                date: yesterdayDate,
                ageRange1: '0',
                ageRange2: '0',
                ageRange3: '0',
                ageRange4: '1',
                ageRange5: '1',
                ageRange6: '0',
                male: '0',
                female: '0',
                undisclosed: '3',
                totalGender: '3',
            },
        ]);
    });

    it('should return a list of added beneficiaries by previous managers (deleted accounts)', async () => {
        const users = await tests.factories.UserFactory({ n: 4 });
        const community = await tests.factories.CommunityFactory([
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
        ]);

        const tx = tests.config.utils.randomTx();

        await tests.factories.ManagerFactory(
            users.slice(0, 3),
            community[0].id
        );
        await services.ubi.BeneficiaryService.add(
            users[3].address,
            users[0].address,
            community[0].id,
            tx,
            new Date()
        );

        const sixteenDaysAgo = new Date();
        sixteenDaysAgo.setDate(sixteenDaysAgo.getDate() - 16);
        await database.models.appUser.update(
            {
                deletedAt: sixteenDaysAgo,
            },
            {
                where: {
                    address: users[0].address,
                },
            }
        );

        await verifyDeletedAccounts();

        const managers = await services.ubi.CommunityService.getManagers(
            community[0].id
        );

        managers.forEach((manager) => {
            if (manager.address === users[0].address) {
                expect(manager.added).to.be.equal(1);
                // eslint-disable-next-line no-unused-expressions
                expect(manager.user).to.be.null;
                // eslint-disable-next-line no-unused-expressions
                expect(manager.isDeleted).to.be.true;
            } else {
                expect(manager.added).to.be.equal(0);
            }
        });
    });
});
