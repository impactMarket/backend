import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub, match, restore } from 'sinon';

import config from '../../../src/config';
import CommunityAdminABI from '../../../src/contracts/CommunityAdminABI.json';
import { models } from '../../../src/database';
import ImMetadataService from '../../../src/services/app/imMetadata';
import ManagerService from '../../../src/services/ubi/managers';
import { ChainSubscribers } from '../../../src/worker/jobs/chainSubscribers';
import { waitForStubCall } from '../../utils';
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
    const communities = new Map<string, string>();
    const communitiesId = new Map<string, number>();
    const communitiesVisibility = new Map<string, boolean>();
    const ganacheProvider = ganache.provider({
        mnemonic:
            'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain',
    });
    let getLastBlockStub: SinonStub<any, any>;
    let getRecoverBlockStub: SinonStub<any, any>;

    before(async () => {
        provider = new ethers.providers.Web3Provider(ganacheProvider);
        accounts = await provider.listAccounts();
        communityUpdated = stub(models.community, 'update');
        communityUpdated.returns(Promise.resolve([1, {} as any]));
        findCommunity = stub(models.community, 'findOne');
        findCommunity.returns(Promise.resolve({ publicId: 'public-id' }));
        beneficiaryUpdated = stub(models.beneficiary, 'update');
        let lastBlock = 0;

        stub(ManagerService, 'add').returns(Promise.resolve(true));
        stub(ImMetadataService, 'setLastBlock').callsFake(async (v) => {
            lastBlock = v;
        });
        stub(ImMetadataService, 'setRecoverBlockUsingLastBlock').returns(
            Promise.resolve()
        );
        getLastBlockStub = stub(ImMetadataService, 'getLastBlock');
        getRecoverBlockStub = stub(ImMetadataService, 'getRecoverBlock');
        getLastBlockStub.returns(Promise.resolve(lastBlock));
        getRecoverBlockStub.returns(Promise.resolve(lastBlock));

        const cUSDFactory = new ethers.ContractFactory(
            cUSDContractJSON.abi,
            cUSDContractJSON.bytecode,
            provider.getSigner(0)
        );
        cUSD = await cUSDFactory.deploy();

        CommunityAdminFactory = new ethers.ContractFactory(
            CommunityAdminABI,
            CommunityAdminContractJSON.bytecode,
            provider.getSigner(0)
        );

        CommunityAdminContract = await CommunityAdminFactory.deploy(
            cUSD.address
        );

        stub(config, 'communityAdminAddress').value(
            CommunityAdminContract.address
        );

        subscribers = new ChainSubscribers(
            provider,
            [],
            communities,
            communitiesId,
            communitiesVisibility
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
        await waitForStubCall(communityUpdated, 1);
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
        await waitForStubCall(communityUpdated, 1);
        communityUpdated.reset();

        const contractAddress = txResult.events[0].args[0];
        const removedCommunity = await CommunityAdminContract.connect(
            provider.getSigner(0)
        ).removeCommunity(contractAddress);
        await removedCommunity.wait();

        await waitForStubCall(communityUpdated, 1);
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
        await waitForStubCall(beneficiaryUpdated, 1);
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

    it('migrate community', async () => {
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
        await waitForStubCall(communityUpdated, 1);
        assert.callCount(communityUpdated, 1);
        communityUpdated.reset();

        const previousCommunityAddress = txResult.events[0].args[0];
        const migratedCommunity = await CommunityAdminContract.connect(
            provider.getSigner(0)
        ).migrateCommunity([accounts[1]], previousCommunityAddress);
        const migratedCommunityTxResult = await migratedCommunity.wait();
        const contractAddress = migratedCommunityTxResult.events[0].args[1];

        await waitForStubCall(communityUpdated, 1);
        assert.callCount(communityUpdated, 1);
        assert.calledWith(
            communityUpdated.getCall(0),
            {
                contractAddress,
            },
            {
                where: {
                    contractAddress: previousCommunityAddress,
                },
            }
        );
    });
});
