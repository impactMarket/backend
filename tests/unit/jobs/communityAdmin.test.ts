import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub } from 'sinon';

import config from '../../../src/config';
import { models } from '../../../src/database';
import ImMetadataService from '../../../src/services/app/imMetadata';
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
        let lastBlock = 0;

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
            CommunityAdminContractJSON.abi,
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
    });

    it('add community', async () => {
        const newCommunityAddress = await CommunityAdminContract.connect(
            provider.getSigner(0)
        ).addCommunity(
            accounts[1],
            '2000000000000000000',
            '1500000000000000000000',
            86400,
            300
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
});
