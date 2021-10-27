import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub, match, restore } from 'sinon';

import config from '../../../src/config';
import { models } from '../../../src/database';
import ImMetadataService from '../../../src/services/app/imMetadata';
import { ChainSubscribers } from '../../../src/worker/jobs/chainSubscribers';
import { waitForStubCall } from '../../utils';
import CommunityContractJSON from './CommunityContract.json';
import cUSDContractJSON from './cUSD.json';
import BeneficiaryService from '../../../src/services/ubi/beneficiary';

describe('communityContract', () => {
    // let provider: ethers.providers.Web3Provider;
    let provider: ethers.providers.JsonRpcProvider;
    let subscribers: ChainSubscribers;
    let accounts: string[] = [];
    let cUSD: ethers.Contract;
    let CommunityContract: ethers.Contract;
    let communityUpdated: SinonStub<any, any>;
    let findCommunity: SinonStub<any, any>;
    let beneficiaryUpdated: SinonStub<any, any>;
    let CommunityContractFactory: ethers.ContractFactory;
    const communities = new Map<string, string>();
    const communitiesId = new Map<string, number>();
    const communitiesVisibility = new Map<string, boolean>();
    const ganacheProvider = ganache.provider({
        mnemonic:
            'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain',
    });
    let getLastBlockStub: SinonStub<any, any>;
    let getRecoverBlockStub: SinonStub<any, any>;
    let beneficiaryAdd: SinonStub<any, any>;

    before(async () => {
        // provider = new ethers.providers.Web3Provider(ganacheProvider);
        provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        accounts = await provider.listAccounts();
        communityUpdated = stub(models.community, 'update');
        communityUpdated.returns(Promise.resolve([1, {} as any]));
        findCommunity = stub(models.community, 'findOne');
        findCommunity.returns(Promise.resolve({ publicId: 'public-id' }));
        beneficiaryUpdated = stub(models.beneficiary, 'update');
        beneficiaryAdd = stub(BeneficiaryService, 'add');
        beneficiaryAdd.returns(Promise.resolve(true));
        
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

        CommunityContractFactory = new ethers.ContractFactory(
            CommunityContractJSON.abi,
            CommunityContractJSON.bytecode,
            provider.getSigner(0)
        );

        try {
        CommunityContract = await CommunityContractFactory.deploy();
            
        } catch (error) {
            console.log(error)
        }

        // stub(config, 'communityAdminAddress').value(
        //     CommunityContract.address
        // );

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
        restore()
    });

    afterEach(() => {
        communityUpdated.reset();
        beneficiaryUpdated.reset();
    });

    it('new add beneficiary', async () => {
        const newCommunityAddress = await CommunityContract.connect(
            provider.getSigner(0)
        ).initialize(
            accounts[1],
            '2000000000000000000',
            '1500000000000000000000',
            1,
            86400,
            300,
            '2000000000000000000',
            '1500000000000000000000',
            '0x0000000000000000000000000000000000000000',
            []
        );

        const initialized = await newCommunityAddress.addBeneficiary(accounts[1])
        // const txResult = await newCommunityAddress.wait();
        await waitForStubCall(beneficiaryAdd, 1);
        assert.callCount(beneficiaryAdd, 1);
        // assert.calledWith(
        //     beneficiaryAdd.getCall(0),
        //     accounts[5],
        //     accounts[1],
        //     thisCommunityPublicId,
        //     match.any,
        //     match.any
        // );
    });
});
