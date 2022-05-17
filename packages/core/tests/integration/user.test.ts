import { expect } from 'chai';
import { ethers } from 'ethers';
import faker from 'faker';
import { Sequelize } from 'sequelize';
import { SinonStub, stub, restore } from 'sinon';
import tk from 'timekeeper';

import { models } from '../../src/database';
import { AppUser } from '../../src/interfaces/app/appUser';
import { CommunityAttributes } from '../../src/interfaces/ubi/community';
import UserService from '../../src/services/app/user';
import { BaseError } from '../../src/utils/baseError';
import { sequelizeSetup, truncate } from '../config/sequelizeSetup';
import { jumpToTomorrowMidnight } from '../config/utils';
import CommunityFactory from '../factories/community';
import ManagerFactory from '../factories/manager';
import BeneficiaryFactory from '../factories/beneficiary';
import UserFactory from '../factories/user';
import CommunityService from '../../src/services/ubi/community';
import LogService from '../../src/services/app/user/log';
import { LogTypes } from '../../src/interfaces/app/appLog';
import * as subgraph from '../../src/subgraph/queries/community';
import * as userSubgraph from '../../src/subgraph/queries/user';

describe('user service', () => {
    let sequelize: Sequelize;
    let returnCommunityStateSubgraph: SinonStub;
    let returnUserRoleSubgraph: SinonStub;
    const logService = new LogService();

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

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

        returnUserRoleSubgraph = stub(userSubgraph, 'getUserRoles');
    });

    after(async () => {
        await truncate(sequelize, 'AppLogModel');
        await truncate(sequelize, 'AppUserModel');
        await truncate(sequelize, 'Manager');
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize);
        restore();
    });

    describe('authenticate', () => {
        it('authentication creates new user with basic params', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.phoneNumber();
            const newUser = await UserService.authenticate({
                address,
                phone,
            });
            const findUser = await models.appUser.findOne({
                where: { address: newUser.user.address },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(findUser).to.not.be.null;
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
                phone,
            });
            const findUser = await models.appUser.findOne({
                where: { address: newUser.user.address },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(findUser).to.not.be.null;
            // eslint-disable-next-line no-unused-expressions
            expect(newUser.user).to.include({
                address,
                phone,
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
                phone,
            });
            const loadUser = await UserService.authenticate({
                address,
                phone,
            });
            const findUser = await models.appUser.findOne({
                where: { address: loadUser.user.address },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(findUser).to.not.be.null;
            expect(loadUser.user).to.include({
                address,
                phone,
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
                phone,
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
                phone,
            });
            const findUser = await models.appUser.findOne({
                where: { address: loadUser.user.address },
            });
            // eslint-disable-next-line no-unused-expressions
            expect(findUser).to.not.be.null;
            expect(loadUser.user).to.include({
                address,
                phone,
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

        it('authentication should return an error when trying to create a new account with an already used phone', async () => {
            const firstRandomWallet = ethers.Wallet.createRandom();
            const secondRandomWallet = ethers.Wallet.createRandom();
            const firstAddress = await firstRandomWallet.getAddress();
            const secondAddress = await secondRandomWallet.getAddress();
            const phone = faker.phone.phoneNumber();

            await UserService.authenticate({
                address: firstAddress,
                phone,
            });
            let error: any;
            await UserService.authenticate({
                address: secondAddress,
                phone,
            }).catch((err) => {
                error = err;
            });

            expect(error.message).to.equal(
                'phone associated with another account'
            );
        });

        it('authentication should inactivate the old account and create a new', async () => {
            const firstRandomWallet = ethers.Wallet.createRandom();
            const secondRandomWallet = ethers.Wallet.createRandom();
            const firstAddress = await firstRandomWallet.getAddress();
            const secondAddress = await secondRandomWallet.getAddress();
            const phone = faker.phone.phoneNumber();

            await UserService.authenticate({
                address: firstAddress,
                phone,
            });

            const loadUser = await UserService.authenticate(
                {
                    address: secondAddress,
                    phone,
                },
                true
            );

            const findUser = await models.appUser.findOne({
                where: { address: firstAddress },
            });
            const user = findUser?.toJSON() as AppUser;

            expect(loadUser.user).to.include({
                address: secondAddress,
                suspect: false,
                active: true,
            });

            // eslint-disable-next-line no-unused-expressions
            expect(user.active).to.be.false;
        });

        it('authentication should return error when trying to access an inactive account', async () => {
            const firstRandomWallet = ethers.Wallet.createRandom();
            const secondRandomWallet = ethers.Wallet.createRandom();
            const firstAddress = await firstRandomWallet.getAddress();
            const secondAddress = await secondRandomWallet.getAddress();
            const phone = faker.phone.phoneNumber();

            // create the first account
            await UserService.authenticate({
                address: firstAddress,
                phone,
            });

            // replace by a new account
            await UserService.authenticate(
                {
                    address: secondAddress,
                    phone,
                },
                true
            );

            let error: any;

            // try to login with the first account again
            await UserService.authenticate({
                address: firstAddress,
                phone,
            }).catch((err) => {
                error = err;
            });

            expect(error.message).to.equal('user is inactive');
        });

        it('validate last login', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.phoneNumber();
            const login = await UserService.authenticate({
                address,
                phone,
            });

            const oldLastLogin = login.user.lastLogin;

            tk.travel(jumpToTomorrowMidnight());

            await UserService.authenticate({
                address,
                phone,
            });

            const user = await models.appUser.findOne({
                where: { address },
                attributes: ['lastLogin'],
            });

            expect(user!.lastLogin).to.be.gt(oldLastLogin);
        });
    });

    describe('welcome', () => {
        it('welcome existing account (no push notification token)', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.phoneNumber();
            const newUser = await UserService.authenticate({
                address,
                phone,
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
                phone,
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

    describe('update', () => {
        it('should update user successfully', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.phoneNumber();
            await UserService.authenticate({
                address,
                phone,
            });

            const data = {
                language: 'pt',
                currency: 'rs',
                username: 'New Name',
                gender: 'm',
                year: 22,
                children: 1,
                avatarMediaId: 1,
                pushNotificationToken: 'notification-token',
            };
            const userUpdated = await UserService.edit({
                address,
                ...data,
            } as AppUser);

            expect(userUpdated).to.include(data);
        });
    });

    describe('notifications', () => {
        let users: AppUser[];

        before(async () => {
            users = await UserFactory({ n: 3 });
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            await models.appNotification.bulkCreate([
                {
                    userId: users[0].id,
                    type: 1,
                    params: { param: 'param_test' },
                },
                {
                    userId: users[0].id,
                    type: 2,
                    params: { param: 'param_test' },
                },
                {
                    userId: users[1].id,
                    type: 1,
                    params: { param: 'param_test' },
                },
                {
                    userId: users[2].id,
                    type: 1,
                    params: { param: 'param_test' },
                },
            ]);
        });

        it('get all notifications from a user', async () => {
            const notifications = await UserService.getNotifications(
                {
                    limit: '10',
                    offset: '0',
                },
                users[0].id
            );

            expect(notifications.length).to.be.equal(2);
            notifications.forEach((notification) => {
                // eslint-disable-next-line no-unused-expressions
                expect(notification.read).to.be.false;
            });
        });

        it('mark all notifications as read', async () => {
            await UserService.readNotifications(users[1].id);

            const readNotifications = await UserService.getUnreadNotifications(
                users[1].id
            );
            const unreadNotifications =
                await UserService.getUnreadNotifications(users[2].id);

            expect(readNotifications).to.be.equal(0);
            expect(unreadNotifications).to.be.equal(1);
        });
    });

    describe('newsletter', () => {
        let users: AppUser[];
        let searchContactStub: SinonStub;
        let createContactStub: SinonStub;
        let deleteContactStub: SinonStub;

        before(async () => {
            users = await UserFactory({ n: 1 });
            searchContactStub = stub(
                UserService.hubspotClient.crm.contacts.searchApi,
                'doSearch'
            );
            createContactStub = stub(
                UserService.hubspotClient.crm.contacts.basicApi,
                'create'
            );
            deleteContactStub = stub(
                UserService.hubspotClient.crm.contacts.basicApi,
                'archive'
            );
        });

        after(async () => {
            searchContactStub.restore();
            createContactStub.restore();
            deleteContactStub.restore();
        });

        after(async () => {
            await truncate(sequelize, 'AppLogModel');
            await truncate(sequelize);
        });

        it('verify subscription with user without email', async () => {
            const subscription = await UserService.verifyNewsletterSubscription(
                users[0].address
            );

            expect(subscription).to.be.equal(false);
        });

        it('update email', async () => {
            const email = faker.internet.email();
            const user: AppUser = await UserService.edit({
                address: users[0].address,
                email,
            } as AppUser);
            expect(user.email).to.be.equal(email);
        });

        it('verify subscription before subscription', async () => {
            searchContactStub.returns(
                Promise.resolve({ body: { results: [] } } as any)
            );

            const subscription = await UserService.verifyNewsletterSubscription(
                users[0].address
            );

            expect(subscription).to.be.equal(false);
        });

        it('subscribe', async () => {
            createContactStub.returns(
                Promise.resolve({ body: { id: '123' } } as any)
            );

            const subscription = await UserService.subscribeNewsletter(
                users[0].address,
                { subscribe: true }
            );
            expect(subscription).to.be.equal(true);
        });

        it('should fail when trying to subscribe an existing email', async () => {
            createContactStub.returns(
                Promise.reject(
                    new BaseError(
                        '',
                        'Contact already exists. Existing ID: 123'
                    )
                )
            );

            UserService.subscribeNewsletter(users[0].address, {
                subscribe: true,
            })
                .catch((e) =>
                    expect(e.message).to.include(
                        'Contact already exists. Existing ID:'
                    )
                )
                .then(() => {
                    throw new Error(
                        "'fails to welcome not existing account' expected to fail"
                    );
                });
        });

        it('unsubscribe', async () => {
            searchContactStub.returns(
                Promise.resolve({ body: { results: [{ id: '123' }] } } as any)
            );
            createContactStub.returns(Promise.resolve(true));

            const subscription = await UserService.subscribeNewsletter(
                users[0].address,
                { subscribe: false }
            );
            expect(subscription).to.be.equal(true);
        });

        it('should fail when trying to unsubscribe without be subscribed', async () => {
            searchContactStub.returns(
                Promise.resolve({ body: { results: [] } } as any)
            );

            UserService.subscribeNewsletter(users[0].address, {
                subscribe: false,
            })
                .catch((e) =>
                    expect(e.message).to.be.equal('User not found on HubsPot')
                )
                .then(() => {
                    throw new Error(
                        "'fails to welcome not existing account' expected to fail"
                    );
                });
        });
    });

    describe('delete', () => {
        let users: AppUser[];
        let communities: CommunityAttributes[];

        before(async () => {
            users = await UserFactory({ n: 4 });
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
            await ManagerFactory([users[0]], communities[0].id);
        });

        it('should not delete a user when he is one of the only two managers in the community', async () => {
            UserService.delete(users[0].address)
                .catch((err) => expect(err).to.be.equal('Not enough managers'))
                .then(() => {
                    throw new Error('expected to fail');
                });
        });

        it('manager should be able to be delete account', async () => {
            await ManagerFactory([users[2], users[3]], communities[0].id);

            await UserService.delete(users[0].address);

            const user = await models.appUser.findOne({
                where: {
                    address: users[0].address,
                },
            });

            // eslint-disable-next-line no-unused-expressions
            expect(user?.deletedAt).to.be.not.null;
        });

        it('should not delete with only two managers (not in deletion process)', async () => {
            UserService.delete(users[2].address)
                .catch((err) => expect(err).to.equal('Not enough managers'))
                .then(() => {
                    throw new Error('expected to fail');
                });
        });

        it('beneficiary should be able to delete account', async () => {
            await UserService.delete(users[1].address);

            const findUser = await models.appUser.findAll();

            findUser.forEach((user: AppUser) => {
                if (
                    user.address === users[1].address ||
                    user.address === users[0].address
                ) {
                    // eslint-disable-next-line no-unused-expressions
                    expect(user.deletedAt).to.be.not.null;
                } else {
                    // eslint-disable-next-line no-unused-expressions
                    expect(user.deletedAt).to.be.null;
                }
            });
        });

        it('should return error when trying to login with an account in the deletion process', async () => {
            UserService.authenticate({
                address: users[0].address,
            })
                .then((res) => {
                    throw new Error(
                        "'fails to authenticate deleted account' expected to fail"
                    );
                })
                .catch((err) => {
                    expect(err.message).to.equal('account in deletion process');
                });
        });

        it('should cancel the deletion process', async () => {
            const resp = await UserService.authenticate(
                {
                    address: users[0].address,
                },
                undefined,
                true
            );

            // eslint-disable-next-line no-unused-expressions
            expect(resp.user.deletedAt).to.be.null;
        });
    });

    describe('user logs', () => {
        let users: AppUser[];
        let communities: CommunityAttributes[];

        before(async () => {
            users = await UserFactory({ n: 4 });
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
                    ambassadorAddress: users[3].address,
                },
            ]);
            returnUserRoleSubgraph.returns({
                beneficiary: {
                    community: communities[0].contractAddress,
                },
                manager: null,
            });
            await ManagerFactory([users[0]], communities[0].id);
            await BeneficiaryFactory([users[1], users[2]], communities[0].id);
        });

        afterEach(async () => {
            await truncate(sequelize, 'AppLogModel');
        });

        it('get user logs - edited community', async () => {
            await CommunityService.edit(
                communities[0].id,
                {
                    name: communities[0].name,
                    description: communities[0].description,
                    currency: communities[0].currency,
                    coverMediaId: communities[0].coverMediaId,
                    coverMediaPath: communities[0].coverMediaPath,
                    email: communities[0].email,
                },
                users[0].address,
                users[0].id
            );

            const logs = await logService.get(
                users[3].address,
                'edited_community',
                communities[0].id.toString()
            );

            expect(logs[0]).to.include({
                userId: users[0].id,
                type: LogTypes.EDITED_COMMUNITY,
            });
            expect(logs[0].detail).to.include({
                name: communities[0].name,
                description: communities[0].description,
                currency: communities[0].currency,
                // coverMediaId: communities[0].coverMediaId,
                email: communities[0].email,
            });
            expect(logs[0].user).to.include({
                address: users[0].address,
                username: users[0].username,
            });
        });

        it('get user logs - edited profile', async () => {
            await UserService.edit({
                username: 'new name',
                avatarMediaId: 1,
                address: users[1].address,
            } as AppUser);

            const logs = await logService.get(
                users[3].address,
                'edited_user',
                users[1].address
            );

            expect(logs[0]).to.include({
                userId: users[1].id,
                type: LogTypes.EDITED_PROFILE,
            });
            expect(logs[0].detail).to.include({
                username: 'new name',
                avatarMediaId: 1,
            });
            expect(logs[0].user).to.include({
                address: users[1].address,
                username: 'new name',
            });
        });

        it('should not list logs when is not an ambassador', async () => {
            await CommunityService.edit(
                communities[0].id,
                {
                    name: communities[0].name,
                    description: communities[0].description,
                    currency: communities[0].currency,
                    coverMediaId: communities[0].coverMediaId,
                    coverMediaPath: communities[0].coverMediaPath,
                    email: communities[0].email,
                },
                users[0].address,
                users[0].id
            );

            logService
                .get(
                    users[0].address,
                    'edited_community',
                    communities[0].id.toString()
                )
                .catch((e) => expect(e.name).to.be.equal('COMMUNITY_NOT_FOUND'))
                .then(() => {
                    throw new Error('expected to fail');
                });
        });
    });
});
