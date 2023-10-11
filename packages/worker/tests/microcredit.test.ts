import { ChainSubscribers } from '../src/chainSubscribers';
import { Sequelize } from 'sequelize';
import { SinonStub, assert, restore, stub } from 'sinon';
import { config, database, tests, utils, interfaces } from '@impactmarket/core';
import { ethers } from 'ethers';
import MicrocreditJSON from './Microcredit.json';
import admin from 'firebase-admin';
import ganache from 'ganache';

describe.skip('Microcredit', () => {
    let sequelize: Sequelize;
    let provider: ethers.providers.Web3Provider;
    let subscribers: ChainSubscribers;
    let MicrocreditContract: ethers.Contract;
    let MicrocreditFactory: ethers.ContractFactory;
    let accounts: string[] = [];
    let notificationUpdated: SinonStub<any, any>;

    const ganacheProvider = ganache.provider({
        mnemonic: 'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain'
    });

    before(async () => {
        sequelize = tests.config.setup.sequelizeSetup();
        await sequelize.sync();
        provider = new ethers.providers.Web3Provider(ganacheProvider as any);
        accounts = await provider.listAccounts();
        notificationUpdated = stub(database.models.appNotification, 'bulkCreate');
        notificationUpdated.returns(Promise.resolve({} as any));
        MicrocreditFactory = new ethers.ContractFactory(
            MicrocreditJSON.abi,
            MicrocreditJSON.bytecode,
            provider.getSigner(accounts[0])
        );
        MicrocreditContract = await MicrocreditFactory.deploy();

        stub(config, 'microcreditContractAddress').value(MicrocreditContract.address);

        stub(database, 'redisClient').value({
            set: async () => null
        });

        stub(utils.prismic.client, 'getAllByType').returns(
            Promise.resolve([
                {
                    data: {
                        'message-type4Title': [
                            {
                                text: 'Loan Added'
                            }
                        ],
                        'message-type4Description': [
                            {
                                text: 'Loan Added'
                            }
                        ]
                    }
                }
            ] as any)
        );

        stub(admin.credential, 'cert').returns({} as any);
        stub(admin, 'initializeApp');
        stub(admin, 'messaging').returns({
            async sendMulticast() {
                return Promise.resolve();
            }
        } as any);

        subscribers = new ChainSubscribers(provider as any, provider, new Map([]));
    });

    after(async () => {
        if (subscribers !== undefined) {
            subscribers.stop();
        }
        provider.removeAllListeners();
        await tests.config.setup.truncate(sequelize, 'appUser');
        await tests.config.setup.truncate(sequelize);
        restore();
    });

    it('add loan', async () => {
        // create account
        const user = await database.models.appUser.create({
            address: accounts[0],
            walletPNT: 'abc123'
        });

        await MicrocreditContract.connect(provider.getSigner(accounts[0])).addManagers([
            provider.getSigner(accounts[0])._address
        ]);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const newMicrocreditContract = await MicrocreditContract.connect(provider.getSigner(accounts[0])).addLoan(
            accounts[0],
            100,
            90,
            1,
            tomorrow.getTime()
        );

        await newMicrocreditContract.wait();
        await tests.config.utils.waitForStubCall(notificationUpdated, 1);
        assert.callCount(notificationUpdated, 1);
        assert.calledWith(notificationUpdated.getCall(0), [
            {
                userId: user.id,
                type: interfaces.app.appNotification.NotificationType.LOAN_APPLICATION_APPROVED,
                isWallet: true,
                isWebApp: true,
                params: undefined
            }
        ]);
    });
});
