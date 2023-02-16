import {
    database,
    tests,
    config,
    contracts,
    services,
} from '../../../';
import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub, match, restore } from 'sinon';

import { ChainSubscribers } from '../../../src/subscriber/chainSubscribers';
import CommunityAdminContractJSON from './CommunityAdmin.json';
import cUSDContractJSON from './cUSD.json';

describe('communityAdmin', () => {
    let provider: ethers.providers.Web3Provider;
    let subscribers: ChainSubscribers;
    let accounts: string[] = [];
    let cUSD: ethers.Contract;
    let CommunityAdminContract: ethers.Contract;
    let communityUpdated: SinonStub<any, any>;
    let findCommunity: SinonStub<any, any>;
    let beneficiaryUpdated: SinonStub<any, any>;
    let CommunityAdminFactory: ethers.ContractFactory;
    const ganacheProvider = ganache.provider({
        mnemonic:
            'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain',
    });
    let getLastBlockStub: SinonStub<any, any>;
    let getRecoverBlockStub: SinonStub<any, any>;

    before(async () => {
        provider = new ethers.providers.Web3Provider(ganacheProvider);
        accounts = await provider.listAccounts();
        communityUpdated = stub(database.models.community, 'update');
        communityUpdated.returns(Promise.resolve([1, {} as any]));
        findCommunity = stub(database.models.community, 'findOne');
        findCommunity.returns(Promise.resolve({ publicId: 'public-id' }));
        beneficiaryUpdated = stub(database.models.beneficiary, 'update');
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

        CommunityAdminContract = await CommunityAdminFactory.deploy(
            cUSD.address
        );

        stub(config, 'communityAdminAddress').value(
            CommunityAdminContract.address
        );

        subscribers = new ChainSubscribers(provider as any);
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
        beneficiaryUpdated.reset();
    });

    it('add community', async () => {
        const newCommunityAddress = await CommunityAdminContract.connect(
            provider.getSigner(0)
        ).addCommunity(
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
            }
        );
    });

    it('remove community', async () => {
        const newCommunityAddress = await CommunityAdminContract.connect(
            provider.getSigner(0)
        ).addCommunity(
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
        const removedCommunity = await CommunityAdminContract.connect(
            provider.getSigner(0)
        ).removeCommunity(contractAddress);
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
        await tests.config.utils.waitForStubCall(beneficiaryUpdated, 1);
        assert.callCount(beneficiaryUpdated, 1);
        assert.calledWith(
            beneficiaryUpdated.getCall(0),
            {
                active: false,
            },
            {
                where: {
                    communityId: 'public-id',
                },
            }
        );
    });
});
