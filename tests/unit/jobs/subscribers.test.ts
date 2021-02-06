import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { stub, assert, match, SinonStub } from 'sinon';

import { Community } from '../../../src/database/models/community';
import BeneficiaryService from '../../../src/services/beneficiary';
import ClaimsService from '../../../src/services/claim';
import CommunityService from '../../../src/services/community';
import ImMetadataService from '../../../src/services/imMetadata';
import ManagerService from '../../../src/services/managers';
import TransactionsService from '../../../src/services/transactions';
import * as utils from '../../../src/utils/util';
import { subscribeChainEvents } from '../../../src/worker/jobs/chainSubscribers';
import { communityAddressesAndIds } from '../../fake/community';
import CommunityContractJSON from './Community.json';
import cUSDContractJSON from './cUSD.json';

async function waitForStubCall(stub: SinonStub<any, any>, callNumber: number) {
    return new Promise((resolve) => {
        const validationInterval = setInterval(() => {
            if (stub.callCount >= callNumber) {
                resolve('');
                clearInterval(validationInterval);
            }
        }, 1000);
    });
}

describe('[jobs] subscribers', () => {
    const blockTimeDate = new Date();
    let provider: ethers.providers.Web3Provider;
    let communityContract: ethers.Contract;
    const communities = new Map<string, string>();
    const communitiesVisibility = new Map<string, boolean>();
    let accounts: string[] = [];
    let beneficiaryAdd: SinonStub<any, any>;
    let claimAdd: SinonStub<any, any>;
    let managerAdd: SinonStub<any, any>;
    let getAllAddressesAndIds: SinonStub<any, any>;
    let cUSD: ethers.Contract;
    let communityFactory: ethers.ContractFactory;
    //
    const thisCommunityId = 'dc5b4ac6-2fc1-4f14-951a-fae2dcd904bd';

    before(async () => {
        // start provider
        provider = new ethers.providers.Web3Provider(ganache.provider());
        // list accounts
        accounts = await provider.listAccounts();
        // stub results
        stub(utils, 'notifyBeneficiaryAdded').returns(Promise.resolve(true));
        stub(utils, 'getBlockTime').returns(Promise.resolve(blockTimeDate));
        beneficiaryAdd = stub(BeneficiaryService, 'add');
        beneficiaryAdd.returns(Promise.resolve({} as any));
        // stub(BeneficiaryService, 'getAllAddresses').returns(Promise.resolve(accounts.slice(5, 9)));
        stub(
            BeneficiaryService,
            'getAllAddressesInPublicValidCommunities'
        ).returns(Promise.resolve([]));
        stub(ImMetadataService, 'setLastBlock').returns(Promise.resolve());
        stub(TransactionsService, 'add').returns(Promise.resolve({} as any));
        claimAdd = stub(ClaimsService, 'add');
        claimAdd.returns(Promise.resolve({} as any));
        managerAdd = stub(ManagerService, 'add');
        managerAdd.returns(Promise.resolve({} as any));
        getAllAddressesAndIds = stub(CommunityService, 'getAllAddressesAndIds');
        getAllAddressesAndIds.returns(
            Promise.resolve(communityAddressesAndIds)
        );
        // init factories
        const cUSDFactory = new ethers.ContractFactory(
            cUSDContractJSON.abi,
            cUSDContractJSON.bytecode,
            provider.getSigner(0)
        );
        communityFactory = new ethers.ContractFactory(
            CommunityContractJSON.abi,
            CommunityContractJSON.bytecode,
            provider.getSigner(0)
        );
        cUSD = await cUSDFactory.deploy();
        // init event subscribers
        subscribeChainEvents(provider, communities, communitiesVisibility);
        //
        stub(CommunityService, 'getOnlyCommunityByContractAddress').returns(
            Promise.resolve({
                publicId: thisCommunityId,
                visibility: 'public',
                // anything below, does not matter
                city: 'Love',
                contractAddress: '0x0',
                country: 'Love',
                coverImage: '',
                currency: 'cUSD',
                description: '',
                email: '',
                language: 'en',
                name: 'Love',
                requestByAddress: accounts[1],
                started: new Date(),
                status: 'valid',
                createdAt: new Date(),
                updatedAt: new Date(),
            } as Community)
        );
    });

    after(() => {
        provider.removeAllListeners();
    });

    it('create a community', async () => {
        // deploy a community
        communityContract = (
            await communityFactory.deploy(
                accounts[1],
                '2000000000000000000',
                '1500000000000000000000',
                86400,
                300,
                '0x0000000000000000000000000000000000000000',
                cUSD.address,
                '0x0000000000000000000000000000000000000000'
            )
        ).connect(provider.getSigner(1));
        communities.set(communityContract.address, thisCommunityId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...communityAddressesAndIds,
            [communityContract.address, thisCommunityId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await waitForStubCall(managerAdd, 1);
        assert.callCount(managerAdd, 1);
        assert.calledWith(managerAdd.getCall(0), accounts[1], thisCommunityId);
    });

    it('add a beneficiary to valid community', async () => {
        // deploy a community
        communityContract = (
            await communityFactory.deploy(
                accounts[1],
                '2000000000000000000',
                '1500000000000000000000',
                86400,
                300,
                '0x0000000000000000000000000000000000000000',
                cUSD.address,
                '0x0000000000000000000000000000000000000000'
            )
        ).connect(provider.getSigner(1));
        communities.set(communityContract.address, thisCommunityId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...communityAddressesAndIds,
            [communityContract.address, thisCommunityId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await communityContract.addBeneficiary(accounts[5]);
        await waitForStubCall(beneficiaryAdd, 1);
        assert.callCount(beneficiaryAdd, 1);
        assert.calledWith(
            beneficiaryAdd.getCall(0),
            accounts[5],
            thisCommunityId,
            match.any
        );
    });

    it('beneficiary claim from valid community', async () => {
        // deploy a community
        communityContract = (
            await communityFactory.deploy(
                accounts[1],
                '2000000000000000000',
                '1500000000000000000000',
                86400,
                300,
                '0x0000000000000000000000000000000000000000',
                cUSD.address,
                '0x0000000000000000000000000000000000000000'
            )
        ).connect(provider.getSigner(1));
        communities.set(communityContract.address, thisCommunityId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...communityAddressesAndIds,
            [communityContract.address, thisCommunityId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await communityContract.addBeneficiary(accounts[5]);
        await communityContract.connect(provider.getSigner(5)).claim();
        await waitForStubCall(claimAdd, 1);
        assert.callCount(claimAdd, 1);
        assert.calledWith(
            claimAdd.getCall(0),
            accounts[5],
            thisCommunityId,
            match.any,
            match.any,
            match.any
        );
    });
});
