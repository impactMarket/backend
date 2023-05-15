import {
    database,
    tests,
    config,
    contracts,
    services,
} from '../../../';
import { Contract, ContractFactory, JsonRpcProvider, JsonRpcSigner, ethers } from 'ethers';
import ganache from 'ganache';
import { assert, SinonStub, stub, match, restore } from 'sinon';

import { ChainSubscribers } from '../../../src/subscriber/chainSubscribers';
import CommunityAdminContractJSON from './CommunityAdmin.json';
import cUSDContractJSON from './cUSD.json';

describe('communityAdmin', () => {
    let provider: JsonRpcProvider;
    let subscribers: ChainSubscribers;
    let signers: JsonRpcSigner[] = [];
    let accounts: string[] = [];
    let cUSD: Contract;
    let CommunityAdminContract: Contract;
    let communityUpdated: SinonStub<any, any>;
    let findCommunity: SinonStub<any, any>;
    let CommunityAdminFactory: ContractFactory;
    const ganacheProvider = ganache.provider({
        mnemonic:
            'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain',
    });
    let getLastBlockStub: SinonStub<any, any>;
    let getRecoverBlockStub: SinonStub<any, any>;

    before(async () => {
        provider = new JsonRpcProvider(ganacheProvider);
        signers = await provider.listAccounts();
        accounts = signers.map((a) => a.address);
        communityUpdated = stub(database.models.community, 'update');
        communityUpdated.returns(Promise.resolve([1, {} as any]));
        findCommunity = stub(database.models.community, 'findOne');
        findCommunity.returns(Promise.resolve({ id: 1 }));
        let lastBlock = 0;

        stub(services.ubi.ManagerService, 'add').returns(Promise.resolve(true));
        stub(services.app.ImMetadataService, 'setLastBlock').callsFake(
            async (v) => {
                lastBlock = v;
            }
        );
        stub(
            services.app.ImMetadataService,
            'setRecoverBlockUsingLastBlock'
        ).returns(Promise.resolve());
        getLastBlockStub = stub(services.app.ImMetadataService, 'getLastBlock');
        getRecoverBlockStub = stub(
            services.app.ImMetadataService,
            'getRecoverBlock'
        );
        getLastBlockStub.returns(Promise.resolve(lastBlock));
        getRecoverBlockStub.returns(Promise.resolve(lastBlock));

        const cUSDFactory = new ContractFactory(
            cUSDContractJSON.abi,
            cUSDContractJSON.bytecode,
            signers[0]
        );
        cUSD = await cUSDFactory.deploy() as any;
        stub(config, 'cUSDContractAddress').value(cUSD.address);

        CommunityAdminFactory = new ContractFactory(
            contracts.CommunityAdminABI,
            CommunityAdminContractJSON.bytecode,
            signers[0]
        );

        CommunityAdminContract = await CommunityAdminFactory.deploy(
            cUSD.address
        ) as any;

        stub(config, 'communityAdminAddress').value(
            CommunityAdminContract.address
        );

        stub(
            database,
            'redisClient'
        ).value({
            set: async () => null
        });

        subscribers = new ChainSubscribers(
            provider as any,
            provider,
            new Map([]),
        );
    });

    after(() => {
        if (subscribers !== undefined) {
            subscribers.stop();
        }
        provider.removeAllListeners();
        restore();
    });

    afterEach(() => {
        communityUpdated.reset();
    });

    it('add community', async () => {
        const newCommunityAddress = (await CommunityAdminContract.connect(
            signers[0]
        ) as any).addCommunity(
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
                status: 'valid',
            },
            {
                where: {
                    requestByAddress: accounts[1],
                },
                returning: true,
            }
        );
    });

    it('remove community', async () => {
        const newCommunityAddress = (await CommunityAdminContract.connect(
            signers[0]
        ) as any).addCommunity(
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
        const removedCommunity = (await CommunityAdminContract.connect(
            signers[0]
        ) as any).removeCommunity(contractAddress);
        await removedCommunity.wait();

        await tests.config.utils.waitForStubCall(communityUpdated, 1);
        assert.callCount(communityUpdated, 1);
        assert.calledWith(
            communityUpdated.getCall(0),
            {
                status: 'removed',
                deletedAt: match.any,
            },
            {
                where: {
                    contractAddress,
                },
            }
        );
    });
});
