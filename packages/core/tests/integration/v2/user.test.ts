import { Sequelize } from 'sequelize';
import { SinonStub, restore, stub } from 'sinon';
import { ethers } from 'ethers';
import { expect } from 'chai';
import { faker } from '@faker-js/faker';

import * as communitySubgraph from '../../../src/subgraph/queries/community';
import * as userSubgraph from '../../../src/subgraph/queries/user';
import { AppUser } from '../../../src/interfaces/app/appUser';
import { CommunityAttributes } from '../../../src/interfaces/ubi/community';
import { CommunityCreateService } from '../../../src/services/ubi/community/create';
import { LogTypes } from '../../../src/interfaces/app/appLog';
import { models } from '../../../src/database';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import CommunityFactory from '../../factories/community';
import UserFactory from '../../factories/user';
import UserLogService from '../../../src/services/app/user/log';
import UserService from '../../../src/services/app/user/index';

describe('user service v2', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communities: CommunityAttributes[];
    let returnUserRoleSubgraph: SinonStub;
    let returnCommunityStateSubgraph: SinonStub;

    const userService = new UserService();
    const userLogService = new UserLogService();
    const communityCreateService = new CommunityCreateService();

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
        users = await UserFactory({ n: 5 });

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
                ambassadorAddress: users[1].address
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
                ambassadorAddress: users[3].address
            }
        ]);

        returnUserRoleSubgraph = stub(userSubgraph, 'getUserRoles');
        returnCommunityStateSubgraph = stub(communitySubgraph, 'getCommunityState');
    });

    after(async () => {
        await truncate(sequelize, 'appUser');
        await truncate(sequelize, 'community');
        await truncate(sequelize);
        restore();
    });

    describe('create', () => {
        before(() => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: null
            });
        });

        it('create user successfully', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const newUser = await userService.create({
                address
            });
            const findUser = await models.appUser.findOne({
                where: { address: newUser.address }
            });
            expect(findUser).to.not.be.null;
        });
        it('create user overwriting', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.number();
            const newUser = await userService.create(
                {
                    address,
                    phone
                },
                true
            );
            const findUser = await models.appUser.findOne({
                where: { address: newUser.address }
            });
            expect(findUser).to.not.be.null;
        });
        it('duplicated phone number', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const secondRandomWallet = ethers.Wallet.createRandom();
            const firstAddress = await randomWallet.getAddress();
            const secondAddress = await secondRandomWallet.getAddress();
            const phone = faker.phone.number();
            await userService.create({
                address: firstAddress,
                phone
            });
            let error: any;
            await userService
                .create({
                    address: secondAddress,
                    phone
                })
                .catch(err => {
                    error = err;
                });
            expect(error.message).to.equal('phone associated with another account');
        });
        it('create user recovering account', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.number();
            const newUser = await userService.create(
                {
                    address,
                    phone
                },
                false,
                true
            );
            const findUser = await models.appUser.findOne({
                where: { address: newUser.address }
            });
            expect(findUser).to.not.be.null;
        });
        it('login with an existing account', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.number();
            // first login
            const newUser = await userService.create({
                address
            });
            // second login
            await userService.create({
                address,
                phone
            });
            const findUser = await models.appUser.findOne({
                where: { address: newUser.address }
            });
            expect(findUser).to.not.be.null;
        });
        it('login with a different phone number', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const firstPhone = faker.phone.number();
            const secondPhone = faker.phone.number();
            // first login
            await userService.create({
                address,
                phone: firstPhone
            });
            // second login
            const updatedUser = await userService.create({
                address,
                phone: secondPhone
            });
            expect(updatedUser.phone).to.equal(secondPhone);
        });
        it('try to login with an inactive account', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            // first login
            const newUser = await userService.create({
                address
            });

            await models.appUser.update(
                {
                    active: false
                },
                {
                    where: {
                        address: newUser.address
                    }
                }
            );
            // second login
            let error: any;
            await userService
                .create({
                    address
                })
                .catch(err => {
                    error = err;
                });
            expect(error.message).to.equal('user is inactive');
        });
        it('try to login with a deleted account', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const newUser = await userService.create({
                address
            });

            await models.appUser.update(
                {
                    deletedAt: new Date()
                },
                {
                    where: {
                        address: newUser.address
                    }
                }
            );
            // second login
            let error: any;
            await userService
                .create({
                    address
                })
                .catch(err => {
                    error = err;
                });
            expect(error.message).to.equal('account in deletion process');
        });
        it('login with clientId', async () => {
            await models.appClientCredential.create({
                id: 1,
                clientId: 'client123',
                name: 'client',
                status: 'active',
                roles: undefined
            });
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const newUser = await userService.create(
                {
                    address
                },
                false,
                false,
                'client123'
            );

            expect(newUser).to.be.not.null;
        });
        it('login with invalid clientId', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();

            let error: any;
            await userService
                .create(
                    {
                        address
                    },
                    false,
                    false,
                    'client321'
                )
                .catch(err => {
                    error = err;
                });
            expect(error.message).to.equal('Client credential is invalid');
        });
    });

    describe('get', () => {
        before(() => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: null
            });
        });

        it('get an user successfully', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const newUser = await userService.create({
                address
            });

            const user = await userService.get(newUser.address);

            expect(user).to.be.not.null;
        });
        it('get an user with invalid address', async () => {
            let error: any;
            await userService.get('address').catch(err => {
                error = err;
            });

            expect(error.message).to.be.eq('user not found');
        });
    });

    describe('find by', () => {
        it('find user by address', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: {
                    community: communities[0].contractAddress,
                    state: 0
                }
            });
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const newUser = await userService.create({
                address
            });

            const user = await userService.getUserFromAuthorizedAccount(newUser.address, 'managerAddress');

            expect(user).to.be.not.null;
        });
        it('try to find user by address when is not a manager/ambassador/council member', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: null
            });
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const newUser = await userService.create({
                address
            });

            let error: any;
            await userService.getUserFromAuthorizedAccount(newUser.address, 'managerAddress').catch(err => {
                error = err;
            });

            expect(error.message).to.be.eq('user must be ambassador, ubi manager, loand manager or council member');
        });
        it('try to find user with invalid address', async () => {
            returnUserRoleSubgraph.reset();
            returnUserRoleSubgraph
                .onFirstCall()
                .returns({
                    beneficiary: null,
                    manager: {
                        community: communities[0].contractAddress,
                        state: 0
                    }
                })
                .onSecondCall()
                .returns({
                    beneficiary: null,
                    manager: null
                });

            let error: any;
            await userService
                .getUserFromAuthorizedAccount('invalidAddress', 'managerAddress')
                .then(user => console.log({ invalid: user }))
                .catch(err => {
                    error = err;
                });

            expect(error.message).to.be.eq('user not found');
        });
    });

    describe('update', () => {
        it('update user successfully', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: null
            });
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const phone = faker.phone.number();
            await userService.create({
                address
            });
            const user = await userService.update({
                address,
                phone
            });
            expect(user).to.not.be.null;
        });
        it('phone conflict', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: null
            });
            const randomWallet = ethers.Wallet.createRandom();
            const secondRandomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const secondAddress = await secondRandomWallet.getAddress();
            const phone = faker.phone.number();
            await userService.create({
                address,
                phone
            });
            await userService.create({
                address: secondAddress
            });
            let error: any;
            await userService
                .update({
                    address: secondAddress,
                    phone
                })
                .catch(err => {
                    error = err;
                });
            expect(error.message).to.be.eq('phone associated with another account');
        });
        it('update failed', async () => {
            let error: any;
            await userService
                .update({
                    address: 'invalidAddress'
                })
                .catch(err => {
                    error = err;
                });
            expect(error.message).to.be.eq('user was not updated!');
        });
    });

    describe('patch', () => {
        it('read beneficiary rules', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            await userService.create({
                address
            });
            await userService.patch(address, 'beneficiary-rules');
        });
        it('read manager rules', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            await userService.create({
                address
            });
            await userService.patch(address, 'manager-rules');
        });
    });

    describe('delete', () => {
        it('delete user successfully', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: null
            });
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            await userService.create({
                address
            });
            const deleted = await userService.delete(address);
            expect(deleted).to.exist;
        });
        it('try delete a manager account', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: {
                    community: communities[0].contractAddress,
                    state: 0
                }
            });
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            await userService.create({
                address
            });
            let error: any;
            await userService.delete(address).catch(err => {
                error = err;
            });
            expect(error.message).to.be.eq(`Active managers can't delete accounts`);
        });
        it('update failed', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: null
            });
            let error: any;
            await userService.delete('invalidAddress').catch(err => {
                error = err;
            });
            expect(error.message).to.be.eq('User was not updated');
        });
    });

    describe('report', () => {
        after(async () => {
            await truncate(sequelize, 'appAnonymousReport');
        });

        describe('create', () => {
            it('create successfully', async () => {
                const firstReport = await userService.report('report', communities[0].id, 'general');
                const secondReport = await userService.report('report2', communities[1].id, 'general');

                expect(firstReport).to.be.true;
                expect(secondReport).to.be.true;
            });
        });

        describe('list', () => {
            it('list by ambassador address', async () => {
                returnUserRoleSubgraph.returns({
                    beneficiary: null,
                    manager: null,
                    ambassador: {
                        communities: [communities[0].contractAddress]
                    }
                });

                const reports = await userService.getReport(users[1].address, {});

                expect(reports.count).to.be.eq(1);
                expect(reports.rows[0]).to.include({
                    communityId: communities[0].id,
                    message: 'report',
                    category: 'general'
                });
            });
            it('communities not found', async () => {
                let error: any;
                returnUserRoleSubgraph.returns({
                    beneficiary: null,
                    manager: null,
                    ambassador: null
                });
                await userService.getReport('invalidAddress', {}).catch(err => {
                    error = err;
                });
                expect(error.message).to.be.eq('no community found for this ambassador');
            });
        });
    });

    describe('notifications', () => {
        it('get notification', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const user = await userService.create({
                address
            });
            await models.appNotification.create({
                type: 0,
                userId: user.id
            });

            const notifications = await userService.getNotifications(
                {
                    isWebApp: true
                },
                user.id
            );
            expect(notifications).to.be.not.null;
            expect(notifications.count).to.be.eq(1);
        });
        it('read notifications successfully', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const user = await userService.create({
                address
            });
            await models.appNotification.create({
                type: 0,
                userId: user.id
            });
            const notifications = await userService.getNotifications(
                {
                    isWebApp: true
                },
                user.id
            );

            const updated = await userService.readNotifications(user.id, [notifications.rows[0].id]);
            expect(updated).to.be.true;
        });
        it('failed to update notifications', async () => {
            let error: any;
            await userService.readNotifications(0, []).catch(err => {
                error = err;
            });
            expect(error.message).to.be.eq('notifications were not updated!');
        });
        it('get unread notifications', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            const user = await userService.create({
                address
            });
            await models.appNotification.create({
                type: 0,
                userId: user.id
            });
            const notifications = await userService.getNotifications({
                isWebApp: true,
                unreadOnly: true
            }, user.id);

            expect(notifications).to.be.eq(1);
        });
    });

    describe('logs', () => {
        after(async () => {
            await truncate(sequelize, 'appLog');
        });

        it('get user logs - edited community', async () => {
            returnUserRoleSubgraph.returns({
                ambassador: {
                    communities: [communities[0].contractAddress?.toLowerCase()]
                }
            });
            returnCommunityStateSubgraph.returns({
                claims: 0,
                claimed: '0',
                beneficiaries: 0,
                removedBeneficiaries: 0,
                contributed: '0',
                contributors: 0,
                managers: 0,
                baseInterval: 0
            });

            await communityCreateService.edit(
                users[1].address,
                communities[0].id,
                {
                    name: communities[0].name,
                    description: communities[0].description,
                    coverMediaPath: communities[0].coverMediaPath!
                },
                users[1].id
            );

            const logs = await userLogService.get(users[1].address, 'edited_community', communities[0].id.toString());

            expect(logs[0]).to.include({
                userId: users[1].id,
                type: LogTypes.EDITED_COMMUNITY
            });
            expect(logs[0].detail).to.include({
                name: communities[0].name,
                description: communities[0].description,
                coverMediaPath: communities[0].coverMediaPath
            });
            expect(logs[0].user).to.include({
                address: users[1].address
            });
        });

        it('failed to get logs from a invalid community', async () => {
            let error: any;
            await userLogService.get(users[1].address, LogTypes.EDITED_COMMUNITY, '0').catch(err => {
                error = err;
            });
            expect(error.message).to.be.eq('community not found');
        });
        it('get others log', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: {
                    community: communities[0].contractAddress,
                    state: 0
                }
            });
            await models.appLog.create({
                type: LogTypes.EDITED_PROFILE,
                communityId: communities[0].id,
                userId: users[3].id,
                detail: {}
            });
            const logs = await userLogService.get(users[1].address, LogTypes.EDITED_PROFILE, users[3].address);
            expect(logs.length).to.be.eq(1);
        });
        it('failed to get log from a invalid user address', async () => {
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: null
            });
            let error: any;
            await userLogService.get(users[1].address, LogTypes.EDITED_PROFILE, 'invalidAddress').catch(err => {
                error = err;
            });
            expect(error.message).to.be.eq('user not found');
        });
        it('failed to get log from a invalid community address', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const address = await randomWallet.getAddress();
            returnUserRoleSubgraph.returns({
                beneficiary: null,
                manager: {
                    community: address,
                    state: 0
                }
            });
            let error: any;
            await userLogService.get(users[1].address, LogTypes.EDITED_PROFILE, users[0].address).catch(err => {
                error = err;
            });
            expect(error.message).to.be.eq('community not found');
        });
    });
});
