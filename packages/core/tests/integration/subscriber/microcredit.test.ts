import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub, match, restore } from 'sinon';
import { ChainSubscribers } from '../../../src/subscriber/chainSubscribers';
import {
    database,
    tests,
    config,
} from '../../../';
import MicrocreditJSON from './Microcredit.json';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import { Sequelize } from 'sequelize';
import { client as prismic } from '../../../src/utils/prismic';
import { NotificationType } from '../../../src/interfaces/app/appNotification';
import admin from 'firebase-admin';


describe('Microcredit', () => {
    let sequelize: Sequelize;
    let provider: ethers.providers.Web3Provider;
    let subscribers: ChainSubscribers;
    let MicrocreditContract: ethers.Contract;
    let MicrocreditFactory: ethers.ContractFactory;
    let accounts: string[] = [];
    let notificationUpdated: SinonStub<any, any>;

    const ganacheProvider = ganache.provider({
        mnemonic:
            'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain',
    });

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
        provider = new ethers.providers.Web3Provider(ganacheProvider);
        accounts = await provider.listAccounts();
        notificationUpdated = stub(database.models.appNotification, 'bulkCreate');
        notificationUpdated.returns(Promise.resolve({} as any));
        MicrocreditFactory = new ethers.ContractFactory(
            MicrocreditJSON.abi,
            MicrocreditJSON.bytecode,
            provider.getSigner(accounts[0])
        );
        MicrocreditContract = await MicrocreditFactory.deploy();

        stub(config, 'microcreditContractAddress').value(
            MicrocreditContract.address
        );

        stub(
            database,
            'redisClient'
        ).value({
            set: async () => null
        });

        stub(prismic, 'getAllByType').returns(Promise.resolve(
            [
                {
                  data: {
                    "message-type4Title": [
                      {
                        text: "Loan Added",
                      },
                    ],
                    "message-type4Description": [
                      {
                        text: "Loan Added",
                      },
                    ],
                  },
                },
            ] as any
        ));

        stub(admin.credential, 'cert').returns({} as any);
        stub(admin, 'initializeApp');
        stub(admin, 'messaging').returns({
            sendMulticast:  async function () {
                return Promise.resolve();
            }
        } as any);

        subscribers = new ChainSubscribers(
            provider as any,
            provider,
            new Map([]),
        );
    });

    after(async () => {
        if (subscribers !== undefined) {
            subscribers.stop();
        }
        provider.removeAllListeners();
        await truncate(sequelize, 'AppUserModel');
        await truncate(sequelize);
        restore();
    });

    it('add loan', async () => {
        // create account
        const user = await database.models.appUser.create({
            address: accounts[0],
            walletPNT: 'abc123',
        });

        await MicrocreditContract.connect(provider.getSigner(accounts[0])).addManagers([provider.getSigner(accounts[0])._address]);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const newMicrocreditContract = await MicrocreditContract.connect(provider.getSigner(accounts[0])).addLoan(
            accounts[0],
            100,
            90,
            1,
            tomorrow.getTime(),
        );

        await newMicrocreditContract.wait();
        await tests.config.utils.waitForStubCall(notificationUpdated, 1);
        assert.callCount(notificationUpdated, 1);
        assert.calledWith(
            notificationUpdated.getCall(0),
            [{
                userId: user.id,
                type: NotificationType.LOAN_ADDED,
                isWallet: true,
                isWebApp: true
            }]
        );
    });
})