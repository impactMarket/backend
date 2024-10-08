import { SinonStub, assert, match, restore, stub } from 'sinon';
import { config, contracts, database, services, tests } from '@impactmarket/core';
import { ethers } from 'ethers';
import ganache from 'ganache';

import { ChainSubscribers } from '../src/chainSubscribers';
import CommunityAdminContractJSON from './CommunityAdmin.json';
import cUSDContractJSON from './cUSD.json';

describe.skip('communityAdmin', () => {
    let provider: ethers.providers.Web3Provider;
    let subscribers: ChainSubscribers;
    let accounts: string[] = [];
    let cUSD: ethers.Contract;
    let CommunityAdminContract: ethers.Contract;
    let communityUpdated: SinonStub<any, any>;
    let findCommunity: SinonStub<any, any>;
    let CommunityAdminFactory: ethers.ContractFactory;
    const ganacheProvider = ganache.provider({
        quiet: true,
        mnemonic: 'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain'
    });
    let getLastBlockStub: SinonStub<any, any>;
    let getRecoverBlockStub: SinonStub<any, any>;

    before(async () => {
        // types are different, but it works well
        provider = new ethers.providers.Web3Provider(ganacheProvider as any);
        accounts = await provider.listAccounts();
        communityUpdated = stub(database.models.community, 'update');
        communityUpdated.returns(Promise.resolve([1, [{ id: 1 }]]));
        findCommunity = stub(database.models.community, 'findOne');
        findCommunity.returns(Promise.resolve({ id: 1 }));
        let lastBlock = 0;

        stub(services.app.ImMetadataService, 'setLastBlock').callsFake(async v => {
            lastBlock = v;
        });
        stub(services.app.ImMetadataService, 'setRecoverBlockUsingLastBlock').returns(Promise.resolve());
        getLastBlockStub = stub(services.app.ImMetadataService, 'getLastBlock');
        getRecoverBlockStub = stub(services.app.ImMetadataService, 'getRecoverBlock');
        getLastBlockStub.returns(Promise.resolve(lastBlock));
        getRecoverBlockStub.returns(Promise.resolve(lastBlock));

        const cUSDFactory = new ethers.ContractFactory(
            cUSDContractJSON.abi,
            cUSDContractJSON.bytecode,
            provider.getSigner(0)
        );
        cUSD = await cUSDFactory.deploy();
        stub(config, 'cUSDContractAddress').value(cUSD.address);

        CommunityAdminFactory = new ethers.ContractFactory(
            contracts.CommunityAdminABI,
            CommunityAdminContractJSON.bytecode,
            provider.getSigner(0)
        );

        CommunityAdminContract = await CommunityAdminFactory.deploy(cUSD.address);

        const redisClientMap = new Map();
        stub(database, 'redisClient').value({
            set: async (key: string, value: any) => redisClientMap.set(key, value),
            get: async (key: string) => redisClientMap.get(key),
            incr: async (_: string) => null
        });
        stub(config, 'communityAdminAddress').value(CommunityAdminContract.address);

        subscribers = new ChainSubscribers(provider as any, provider, new Map([]));
    });

    after(() => {
        if (subscribers !== undefined) {
            subscribers.stop();
        }
        provider.removeAllListeners();
        restore();
    });

    afterEach(() => {
        communityUpdated.resetHistory();
    });

    it('add community', async () => {
        const newCommunityAddress = await CommunityAdminContract.connect(provider.getSigner(0)).addCommunity(
            [accounts[1]],
            '2000000000000000000',
            '1500000000000000000000',
            '10000000000000000',
            86400,
            300,
            '10000000000000000',
            '1000000000000000000'
        );
        const txResult = await newCommunityAddress.wait();
        await tests.config.utils.waitForStubCall(communityUpdated, 1);
        assert.callCount(communityUpdated, 1);
        assert.calledWith(
            communityUpdated.getCall(0),
            {
                contractAddress: txResult.events[0].args[0],
                status: 'valid'
            },
            {
                where: {
                    requestByAddress: accounts[1]
                },
                returning: true,
                transaction: match.any
            }
        );
    });

    it('remove community', async () => {
        const newCommunityAddress = await CommunityAdminContract.connect(provider.getSigner(0)).addCommunity(
            [accounts[1]],
            '2000000000000000000',
            '1500000000000000000000',
            '10000000000000000',
            86400,
            300,
            '10000000000000000',
            '1000000000000000000'
        );
        const txResult = await newCommunityAddress.wait();
        await tests.config.utils.waitForStubCall(communityUpdated, 1);
        communityUpdated.reset();

        const contractAddress = txResult.events[0].args[0];
        const removedCommunity = await CommunityAdminContract.connect(provider.getSigner(0)).removeCommunity(
            contractAddress
        );
        await removedCommunity.wait();

        await tests.config.utils.waitForStubCall(communityUpdated, 1);
        assert.callCount(communityUpdated, 1);
        assert.calledWith(
            communityUpdated.getCall(0),
            {
                status: 'removed',
                deletedAt: match.any
            },
            {
                where: {
                    contractAddress
                },
                transaction: match.any
            }
        );
    });
});
