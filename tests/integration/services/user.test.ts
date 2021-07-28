import { expect } from 'chai';
import { ethers } from 'ethers';
import faker from 'faker';
import { Sequelize } from 'sequelize';

import { models } from '../../../src/database';
import { CommunityAttributes } from '../../../src/database/models/ubi/community';
import UserService from '../../../src/services/app/user';
import CommunityFactory from '../../factories/community';
import UserFactory from '../../factories/user';
import truncate, { sequelizeSetup } from '../../utils/sequelizeSetup';

describe('user service', () => {
    let sequelize: Sequelize;
    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
    });

    after(async () => {
        await truncate(sequelize);
    });

    describe('authenticate', () => {
        it('authentication creates new user with basic params', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.phoneNumber();
            const newUser = await UserService.authenticate({
                address,
                trust: {
                    phone,
                },
            });
            const findUser = await sequelize.models.UserModel.findOne({
                where: { address: newUser.user.address },
            });
            const findPhone = await sequelize.models.AppUserTrustModel.findOne({
                where: { phone },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(findUser).to.not.be.null;
            // eslint-disable-next-line no-unused-expressions
            expect(findPhone).to.not.be.null;
        });

        it('authentication creates new user with all params', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const currency = faker.finance.currencyCode();
            const username = faker.internet.userName();
            const phone = faker.phone.phoneNumber();
            //
            const newUser = await UserService.authenticate({
                address,
                language: 'pt',
                currency,
                suspect: false,
                username,
                gender: 'u',
                year: 1990,
                children: 1,
                avatarMediaId: 5,
                pushNotificationToken: 'ckniwoaicoska',
                trust: {
                    phone,
                },
            });
            const findUser = await sequelize.models.UserModel.findOne({
                where: { address: newUser.user.address },
            });
            const findPhone = await sequelize.models.AppUserTrustModel.findOne({
                where: { phone },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(findUser).to.not.be.null;
            // eslint-disable-next-line no-unused-expressions
            expect(findPhone).to.not.be.null;
            expect(newUser.user).to.include({
                address,
                language: 'pt',
                currency,
                suspect: false,
                username,
                gender: 'u',
                year: 1990,
                children: 1,
                avatarMediaId: 5,
                pushNotificationToken: 'ckniwoaicoska',
            });
        });

        it('authentication loads existing user with basic params', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.phoneNumber();
            //
            await UserService.authenticate({
                address,
                trust: {
                    phone,
                },
            });
            const loadUser = await UserService.authenticate({
                address,
                trust: {
                    phone,
                },
            });
            const findUser = await sequelize.models.UserModel.findOne({
                where: { address: loadUser.user.address },
            });
            const findPhone = await sequelize.models.AppUserTrustModel.findOne({
                where: { phone },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(findUser).to.not.be.null;
            // eslint-disable-next-line no-unused-expressions
            expect(findPhone).to.not.be.null;
            expect(loadUser.user).to.include({
                address,
            });
        });

        it('authentication loads existing user with all params', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const currency = faker.finance.currencyCode();
            const username = faker.internet.userName();
            const phone = faker.phone.phoneNumber();
            //
            await UserService.authenticate({
                address,
                language: 'pt',
                currency,
                suspect: false,
                username,
                gender: 'u',
                year: 1990,
                children: 1,
                avatarMediaId: 5,
                pushNotificationToken: 'ckniwoaicoska',
                trust: {
                    phone,
                },
            });
            const loadUser = await UserService.authenticate({
                address,
                language: 'pt',
                currency,
                suspect: false,
                username,
                gender: 'u',
                year: 1990,
                children: 1,
                avatarMediaId: 5,
                pushNotificationToken: 'ckniwoaicoska',
                trust: {
                    phone,
                },
            });
            const findUser = await sequelize.models.UserModel.findOne({
                where: { address: loadUser.user.address },
            });
            const findPhone = await sequelize.models.AppUserTrustModel.findOne({
                where: { phone },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(findUser).to.not.be.null;
            // eslint-disable-next-line no-unused-expressions
            expect(findPhone).to.not.be.null;
            expect(loadUser.user).to.include({
                address,
                language: 'pt',
                currency,
                suspect: false,
                username,
                gender: 'u',
                year: 1990,
                children: 1,
                avatarMediaId: 5,
                pushNotificationToken: 'ckniwoaicoska',
            });
        });
    });

    describe('welcome', () => {
        it('welcome existing account (no push notification token)', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.phoneNumber();
            const newUser = await UserService.authenticate({
                address,
                trust: {
                    phone,
                },
            });
            const logged = await UserService.welcome(newUser.user.address);
            // eslint-disable-next-line no-unused-expressions
            expect(logged).to.not.be.null;
        });

        it('welcome existing account (with push notification token)', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.phoneNumber();
            const newUser = await UserService.authenticate({
                address,
                trust: {
                    phone,
                },
            });
            const logged = await UserService.welcome(
                newUser.user.address,
                'sjdhkjsfdksjfks'
            );
            // eslint-disable-next-line no-unused-expressions
            expect(logged).to.not.be.null;
        });

        it('fails to welcome not existing account', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            // const invalidLogin = await UserService.welcome(address);
            // eslint-disable-next-line no-unused-expressions
            UserService.welcome(address)
                .catch((e) => expect(e).to.be.equal('user not found'))
                .then(() => {
                    throw new Error(
                        "'fails to welcome not existing account' expected to fail"
                    );
                });
        });
    });

    describe('report', () => {
        let communities: CommunityAttributes[] = [];
        before(async () => {
            const users = await UserFactory({ n: 1 });
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
            ]);
        });

        afterEach(async () => {
            await truncate(sequelize, 'AppAnonymousReportModel');
        });

        it('submit a report with community publicId', async () => {
            const report = await UserService.report(
                faker.lorem.sentence(),
                communities[0].publicId
            );
            // eslint-disable-next-line no-unused-expressions
            expect(report).to.not.be.null;
            const result = await models.anonymousReport.findOne({
                where: { communityId: communities[0].id },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(result).to.not.be.null;
        });

        it('submit a report with community id', async () => {
            const report = await UserService.report(
                faker.lorem.sentence(),
                communities[0].id
            );
            // eslint-disable-next-line no-unused-expressions
            expect(report).to.not.be.null;
            const result = await models.anonymousReport.findOne({
                where: { communityId: communities[0].id },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(result).to.not.be.null;
        });

        it('submit a report with community with category', async () => {
            const report = await UserService.report(
                faker.lorem.sentence(),
                communities[0].id,
                'potential-fraud'
            );
            // eslint-disable-next-line no-unused-expressions
            expect(report).to.not.be.null;
            const result = await models.anonymousReport.findOne({
                where: { communityId: communities[0].id },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(result).to.not.be.null;
            expect(result!.category).to.be.equal('potential-fraud');
        });
    });
});
