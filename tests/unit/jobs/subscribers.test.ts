import { ethers } from 'ethers';
import ganache from 'ganache-cli';
// import { Transaction } from 'sequelize';
import { stub, assert, match, SinonStub } from 'sinon';

import { Community } from '../../../src/database/models/community';
import BeneficiaryService from '../../../src/services/beneficiary';
import BeneficiaryTransactionService from '../../../src/services/beneficiaryTransaction';
import ClaimsService from '../../../src/services/claim';
import CommunityService from '../../../src/services/community';
import ImMetadataService from '../../../src/services/imMetadata';
import InflowService from '../../../src/services/inflow';
import ManagerService from '../../../src/services/managers';
import TransactionsService from '../../../src/services/transactions';
import * as utils from '../../../src/utils/util';
import { ChainSubscribers } from '../../../src/worker/jobs/chainSubscribers';
import { communityAddressesAndIds } from '../../fake/community';
import { waitForStubCall } from '../../utils';
import CommunityContractJSON from './Community.json';
import cUSDContractJSON from './cUSD.json';

describe('[jobs] subscribers', () => {
    const blockTimeDate = new Date();
    let provider: ethers.providers.Web3Provider;
    let communityContract: ethers.Contract;
    const communities = new Map<string, string>();
    const communitiesVisibility = new Map<string, boolean>();
    let accounts: string[] = [];
    let beneficiaryAdd: SinonStub<any, any>;
    let beneficiaryTransactionAdd: SinonStub<any, any>;
    let beneficiaryRemove: SinonStub<any, any>;
    let claimAdd: SinonStub<any, any>;
    let managerAdd: SinonStub<any, any>;
    let managerRemove: SinonStub<any, any>;
    let inflowAdd: SinonStub<any, any>;
    // let beneficiaryAdd: SinonStub<
    //     [address: string, communityId: string, tx: string, txAt: Date],
    //     Promise<boolean>
    // >;
    // let beneficiaryRemove: SinonStub<[address: string], Promise<void>>;
    // let claimAdd: SinonStub<
    //     [
    //         address: string,
    //         communityId: string,
    //         amount: string,
    //         tx: string,
    //         txAt: Date
    //     ],
    //     Promise<void>
    // >;
    // let managerAdd: SinonStub<
    //     [address: string, communityId: string, t?: Transaction],
    //     Promise<boolean>
    // >;
    // let managerRemove: SinonStub<
    //     [address: string, communityId: string],
    //     Promise<void>
    // >;
    let getAllAddressesAndIds: SinonStub<any, any>;
    let getLastBlockStub: SinonStub<any, any>;
    let getRecoverBlockStub: SinonStub<any, any>;
    let cUSD: ethers.Contract;
    let communityFactory: ethers.ContractFactory;
    let subscribers: ChainSubscribers;

    const ganacheProvider = ganache.provider({
        mnemonic:
            'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain',
    });
    //
    const thisCommunityId = 'dc5b4ac6-2fc1-4f14-951a-fae2dcd904bd';
    let lastBlock = 0;

    before(async () => {
        // start provider
        provider = new ethers.providers.Web3Provider(ganacheProvider);
        // list accounts
        accounts = await provider.listAccounts();
        // stub results
        stub(utils, 'notifyBeneficiaryAdded').returns(Promise.resolve(true));
        stub(utils, 'getBlockTime').returns(Promise.resolve(blockTimeDate));
        beneficiaryAdd = stub(BeneficiaryService, 'add');
        beneficiaryAdd.returns(Promise.resolve(true));
        beneficiaryTransactionAdd = stub(BeneficiaryTransactionService, 'add');
        beneficiaryTransactionAdd.returns(Promise.resolve());
        beneficiaryRemove = stub(BeneficiaryService, 'remove');
        beneficiaryRemove.returns(Promise.resolve());
        inflowAdd = stub(InflowService, 'add');
        inflowAdd.returns(Promise.resolve());
        // stub(BeneficiaryService, 'getAllAddresses').returns(Promise.resolve(accounts.slice(5, 9)));
        stub(
            BeneficiaryService,
            'getAllAddressesInPublicValidCommunities'
        ).returns(Promise.resolve([]));
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
        stub(TransactionsService, 'add').returns(Promise.resolve({} as any));
        claimAdd = stub(ClaimsService, 'add');
        claimAdd.returns(Promise.resolve());
        managerAdd = stub(ManagerService, 'add');
        managerAdd.returns(Promise.resolve(true));
        managerRemove = stub(ManagerService, 'remove');
        managerRemove.returns(Promise.resolve());
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
        subscribers = new ChainSubscribers(
            provider,
            [],
            communities,
            communitiesVisibility
        );
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

    beforeEach(() => {
        // needs to be updated, otherwise will start from zero
        getLastBlockStub.returns(Promise.resolve(lastBlock));
        getRecoverBlockStub.returns(Promise.resolve(lastBlock));
        // stop previous listeners
        subscribers.stop();
        // create new object
        subscribers = new ChainSubscribers(
            provider,
            [],
            communities,
            communitiesVisibility
        );
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

    context('add beneficiary', () => {
        it('to public valid community', async () => {
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
                match.any,
                match.any
            );
        });
    });

    context('remove beneficiary', () => {
        it('from public valid community', async () => {
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
            await communityContract.removeBeneficiary(accounts[5]);
            await waitForStubCall(beneficiaryRemove, 1);
            assert.callCount(beneficiaryRemove, 1);
            assert.calledWith(beneficiaryRemove.getCall(0), accounts[5]);
        });
    });

    context('beneficiary claim', () => {
        it('from public valid community', async () => {
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

    context('add manager', () => {
        it('to public valid community', async () => {
            managerAdd.reset();
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
            await communityContract.addManager(accounts[2]);
            await waitForStubCall(managerAdd, 2);
            assert.callCount(managerAdd, 2);
            assert.calledWith(
                managerAdd.getCall(0),
                accounts[1],
                thisCommunityId
            );
            assert.calledWith(
                managerAdd.getCall(1),
                accounts[2],
                thisCommunityId
            );
        });
    });

    context('remove manager', () => {
        it('from public valid community', async () => {
            managerAdd.reset();
            managerRemove.reset();
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
            await communityContract.addManager(accounts[2]);
            await waitForStubCall(managerAdd, 2);
            await communityContract.removeManager(accounts[2]);
            await waitForStubCall(managerRemove, 1);
            assert.callCount(managerRemove, 1);
            assert.calledWith(
                managerRemove.getCall(0),
                accounts[2],
                thisCommunityId
            );
        });
    });

    context('donation', () => {
        it('to public valid community', async () => {
            managerAdd.reset();
            managerRemove.reset();
            inflowAdd.reset();
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
                .testFakeFundAddress(accounts[2]);
            //
            await cUSD
                .connect(provider.getSigner(2))
                .transfer(communityContract.address, '2000000000000000000');
            await waitForStubCall(inflowAdd, 1);
            assert.callCount(inflowAdd, 1);
            assert.calledWith(
                inflowAdd.getCall(0),
                accounts[2],
                thisCommunityId,
                '2000000000000000000',
                match.any,
                match.any
            );
        });
    });

    context('beneficiary transaction', () => {
        it('to a non beneficiary user', async () => {
            managerAdd.reset();
            managerRemove.reset();
            inflowAdd.reset();
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
            await cUSD
                .connect(provider.getSigner(0))
                .testFakeFundAddress(accounts[5]);
            //
            await communityContract.addBeneficiary(accounts[5]);
            await waitForStubCall(beneficiaryAdd, 1);
            await cUSD
                .connect(provider.getSigner(5))
                .transfer(accounts[6], '2000000000000000000');
            await waitForStubCall(beneficiaryTransactionAdd, 1);
            assert.callCount(beneficiaryTransactionAdd, 1);
            assert.calledWith(beneficiaryTransactionAdd.getCall(0), {
                beneficiary: accounts[5],
                withAddress: accounts[6],
                amount: '2000000000000000000',
                isFromBeneficiary: true,
                tx: match.any,
                date: match.any,
            });
        });
    });

    context('recover missing transactions', () => {
        it('to a non beneficiary user', async () => {
            managerAdd.reset();
            managerRemove.reset();
            inflowAdd.reset();
            beneficiaryTransactionAdd.reset();
            communities.clear();
            communitiesVisibility.clear();
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
            subscribers.stop();
            await cUSD
                .connect(provider.getSigner(0))
                .testFakeFundAddress(communityContract.address);
            await cUSD
                .connect(provider.getSigner(0))
                .testFakeFundAddress(accounts[5]);
            await communityContract.addBeneficiary(accounts[5]);
            await cUSD
                .connect(provider.getSigner(5))
                .transfer(accounts[6], '2000000000000000000');
            subscribers.recover();
            await waitForStubCall(beneficiaryAdd, 1);
            await waitForStubCall(beneficiaryTransactionAdd, 1);
            assert.callCount(beneficiaryTransactionAdd, 1);
            assert.calledWith(beneficiaryTransactionAdd.getCall(0), {
                beneficiary: accounts[5],
                withAddress: accounts[6],
                amount: '2000000000000000000',
                isFromBeneficiary: true,
                tx: match.any,
                date: match.any,
            });
        });
    });
});
