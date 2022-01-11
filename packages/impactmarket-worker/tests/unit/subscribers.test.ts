import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { stub, assert, match, SinonStub, spy, SinonSpy, restore } from 'sinon';

import { database, services, tests, config, contracts, utils } from 'impactmarket-core';

import { ChainSubscribers } from '../../src/jobs/chainSubscribers';
import DAOContractJSON from './IPCTDelegate.json';
import OldCommunityContractJSON from './OldCommunity.json';
import cUSDContractJSON from './cUSD.json';

describe('[jobs] subscribers', () => {
    const blockTimeDate = new Date();
    let provider: ethers.providers.Web3Provider;
    let communityContract: ethers.Contract;
    const communities = new Map<string, string>();
    const communitiesId = new Map<string, number>();
    const communitiesVisibility = new Map<string, boolean>();
    let accounts: string[] = [];
    let beneficiaryAdd: SinonStub<any, any>;
    let beneficiaryTransactionAdd: SinonStub<[any], Promise<void>>;
    let beneficiaryRemove: SinonStub<any, any>;
    let claimAdd: SinonStub<any, any>;
    let managerAdd: SinonStub<any, any>;
    let communityEdit: SinonStub<any, any>;
    let managerRemove: SinonStub<any, any>;
    let inflowAdd: SinonStub<any, any>;
    let imMetadataRemoveRecoverSpy: SinonSpy<[], Promise<void>>;
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
    let treasuryAddress: string = '';
    let subscribers: ChainSubscribers;

    const ganacheProvider = ganache.provider({
        mnemonic:
            'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain',
    });
    //
    const thisCommunityPublicId = 'dc5b4ac6-2fc1-4f14-951a-fae2dcd904bd';
    const thisCommunityId = 1;
    let lastBlock = 0;

    before(async () => {
        // start provider
        provider = new ethers.providers.Web3Provider(ganacheProvider);
        // list accounts
        accounts = await provider.listAccounts();
        // stub results
        stub(utils.util, 'notifyBeneficiaryAdded').returns(Promise.resolve(true));
        stub(utils.util, 'getBlockTime').returns(Promise.resolve(blockTimeDate));
        beneficiaryAdd = stub(services.ubi.BeneficiaryService, 'add');
        beneficiaryAdd.returns(Promise.resolve(true));
        beneficiaryTransactionAdd = stub(services.ubi.BeneficiaryService, 'addTransaction');
        beneficiaryTransactionAdd.returns(Promise.resolve());
        beneficiaryRemove = stub(services.ubi.BeneficiaryService, 'remove');
        beneficiaryRemove.returns(Promise.resolve());
        inflowAdd = stub(services.ubi.InflowService, 'add');
        inflowAdd.returns(Promise.resolve());
        // stub(services.ubi.BeneficiaryService, 'getAllAddresses').returns(Promise.resolve(accounts.slice(5, 9)));
        // stub(Beneficiary, 'findAll').returns(Promise.resolve([]));
        stub(services.app.ImMetadataService, 'setLastBlock').callsFake(async (v) => {
            lastBlock = v;
        });
        stub(services.app.ImMetadataService, 'setRecoverBlockUsingLastBlock').returns(
            Promise.resolve()
        );
        stub(services.ubi.CommunityService, 'getCommunityOnlyByPublicId').returns(
            Promise.resolve({ id: thisCommunityId } as any)
        );
        getLastBlockStub = stub(services.app.ImMetadataService, 'getLastBlock');
        getRecoverBlockStub = stub(services.app.ImMetadataService, 'getRecoverBlock');
        getLastBlockStub.returns(Promise.resolve(lastBlock));
        getRecoverBlockStub.returns(Promise.resolve(lastBlock));
        claimAdd = stub(services.ubi.ClaimService, 'add');
        claimAdd.returns(Promise.resolve());
        managerAdd = stub(services.ubi.ManagerService, 'add');
        managerAdd.returns(Promise.resolve(true));
        communityEdit = stub(services.ubi.CommunityContractService, 'update');
        communityEdit.returns(Promise.resolve(true));
        stub(database.models.community, 'findOne')
            .withArgs({
                attributes: ['id'],
                where: { publicId: thisCommunityPublicId },
            })
            .returns(
                Promise.resolve({
                    id: thisCommunityId,
                    publicId: thisCommunityPublicId,
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
                } as database.Community)
            );
        managerRemove = stub(services.ubi.ManagerService, 'remove');
        managerRemove.returns(Promise.resolve());
        getAllAddressesAndIds = stub(services.ubi.CommunityService, 'getAllAddressesAndIds');
        getAllAddressesAndIds.returns(
            Promise.resolve(tests.fake.community.communityAddressesAndIds)
        );
        imMetadataRemoveRecoverSpy = spy(
            services.app.ImMetadataService,
            'removeRecoverBlock'
        );
        stub(services.ubi.CommunityService, 'getOnlyCommunityByContractAddress').returns(
            Promise.resolve({
                id: thisCommunityId,
                publicId: thisCommunityPublicId,
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
            } as database.Community)
        );
        // init factories
        const cUSDFactory = new ethers.ContractFactory(
            cUSDContractJSON.abi,
            cUSDContractJSON.bytecode,
            provider.getSigner(0)
        );
        communityFactory = new ethers.ContractFactory(
            contracts.OldCommunityABI,
            OldCommunityContractJSON.bytecode,
            provider.getSigner(0)
        );
        const DAOFactory = new ethers.ContractFactory(
            DAOContractJSON.abi,
            DAOContractJSON.bytecode,
            provider.getSigner(0)
        );

        cUSD = await cUSDFactory.deploy();

        const DAOContract = (await DAOFactory.deploy()).connect(
            provider.getSigner(0)
        );

        treasuryAddress = ethers.Wallet.createRandom().address;

        stub(config, 'DAOContractAddress').value(DAOContract.address);
        stub(config.contractAddresses, 'treasury').value(treasuryAddress);
        stub(config, 'cUSDContractAddress').value(cUSD.address);

        // // init event subscribers
        // subscribers = new ChainSubscribers(
        //     provider,
        //     [],
        //     communities,
        //     communitiesVisibility
        // );
    });

    after(() => {
        beneficiaryAdd.restore();
        provider.removeAllListeners();
        restore();
    });

    beforeEach(() => {
        // needs to be updated, otherwise will start from zero
        getLastBlockStub.returns(Promise.resolve(lastBlock));
        getRecoverBlockStub.returns(Promise.resolve(lastBlock));
        // stop previous listeners
        if (subscribers !== undefined) {
            subscribers.stop();
        }
        // create new object
        subscribers = new ChainSubscribers(
            provider,
            [],
            communities,
            communitiesId,
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesId.set(communityContract.address, thisCommunityId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await tests.config.utils.waitForStubCall(managerAdd, 1);
        assert.callCount(managerAdd, 1);
        assert.calledWith(managerAdd.getCall(0), accounts[1], thisCommunityId);
    });

    it('edit a community', async () => {
        // deploy a community
        communityContract = (
            await communityFactory.deploy(
                accounts[1],
                '1000000000000000000',
                '1600000000000000000000',
                86400,
                600,
                '0x0000000000000000000000000000000000000000',
                cUSD.address,
                '0x0000000000000000000000000000000000000000'
            )
        ).connect(provider.getSigner(1));
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesId.set(communityContract.address, thisCommunityId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await communityContract.edit(
            '2000000000000000000',
            '1500000000000000000000',
            86400,
            300
        );
        await tests.config.utils.waitForStubCall(communityEdit, 1);
        assert.callCount(communityEdit, 1);
        assert.calledWith(communityEdit.getCall(0), thisCommunityId, {
            claimAmount: '2000000000000000000',
            maxClaim: '1500000000000000000000',
            baseInterval: 86400,
            incrementInterval: 300,
        });
    });

    it('add beneficiary: to public valid community', async () => {
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await communityContract.addBeneficiary(accounts[5]);
        await tests.config.utils.waitForStubCall(beneficiaryAdd, 1);
        assert.callCount(beneficiaryAdd, 1);
        assert.calledWith(
            beneficiaryAdd.getCall(0),
            accounts[5],
            accounts[1],
            thisCommunityId,
            match.any,
            match.any
        );
    });

    it('remove beneficiary: from public valid community', async () => {
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await communityContract.addBeneficiary(accounts[5]);
        await tests.config.utils.waitForStubCall(beneficiaryAdd, 1);
        await communityContract.removeBeneficiary(accounts[5]);
        await tests.config.utils.waitForStubCall(beneficiaryRemove, 1);
        assert.callCount(beneficiaryRemove, 1);
        assert.calledWith(
            beneficiaryRemove.getCall(0),
            accounts[5],
            accounts[1],
            thisCommunityId,
            match.any,
            match.any
        );
    });

    it('beneficiary claim: from public valid community', async () => {
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
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
        await tests.config.utils.waitForStubCall(claimAdd, 1);
        assert.callCount(claimAdd, 1);
        assert.calledWith(claimAdd.getCall(0), {
            address: accounts[5],
            communityId: thisCommunityId,
            amount: match.any,
            tx: match.any,
            txAt: match.any,
        });
    });

    it('add manager: to public valid community', async () => {
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await communityContract.addManager(accounts[2]);
        await tests.config.utils.waitForStubCall(managerAdd, 2);
        assert.callCount(managerAdd, 2);
        assert.calledWith(managerAdd.getCall(0), accounts[1], thisCommunityId);
        assert.calledWith(managerAdd.getCall(1), accounts[2], thisCommunityId);
    });

    it('remove manager: from public valid community', async () => {
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        //
        await communityContract.addManager(accounts[2]);
        await tests.config.utils.waitForStubCall(managerAdd, 2);
        await communityContract.removeManager(accounts[2]);
        await tests.config.utils.waitForStubCall(managerRemove, 1);
        assert.callCount(managerRemove, 1);
        assert.calledWith(
            managerRemove.getCall(0),
            accounts[2],
            thisCommunityId
        );
    });

    it('donation: to public valid community', async () => {
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(accounts[2]);
        await cUSD
            .connect(provider.getSigner(2))
            .transfer(communityContract.address, '2000000000000000000');
        await tests.config.utils.waitForStubCall(inflowAdd, 1);
        assert.callCount(inflowAdd, 1);
        assert.calledWith(
            inflowAdd.getCall(0),
            accounts[2],
            communityContract.address,
            '2000000000000000000',
            match.any,
            match.any
        );
    });

    it('donation: to DAO', async () => {
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(accounts[3]);

        inflowAdd.reset();

        await cUSD
            .connect(provider.getSigner(3))
            .transfer(treasuryAddress, '2000000000000000000');
        await tests.config.utils.waitForStubCall(inflowAdd, 1);
        assert.callCount(inflowAdd, 1);
        assert.calledWith(
            inflowAdd.getCall(0),
            accounts[3],
            treasuryAddress,
            '2000000000000000000',
            match.any,
            match.any
        );
    });

    it('beneficiary transaction: to a non beneficiary user', async () => {
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await tests.config.utils.waitForStubCall(imMetadataRemoveRecoverSpy, 1);
        beneficiaryAdd.resetHistory();
        beneficiaryTransactionAdd.resetHistory();
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(accounts[7]);
        //
        await communityContract.addBeneficiary(accounts[7]);
        await tests.config.utils.waitForStubCall(beneficiaryAdd, 1);
        await cUSD
            .connect(provider.getSigner(7))
            .transfer(accounts[8], '2200000000000000000');
        await tests.config.utils.waitForStubCall(beneficiaryTransactionAdd, 1);
        assert.callCount(beneficiaryTransactionAdd, 1);
        assert.calledWith(beneficiaryTransactionAdd.getCall(0), {
            beneficiary: accounts[7],
            withAddress: accounts[8],
            amount: '2200000000000000000',
            isFromBeneficiary: true,
            tx: match.any,
            txAt: match.any,
        });
    });

    it('recover missing transactions: to a non beneficiary user', async () => {
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
        communities.set(communityContract.address, thisCommunityPublicId);
        communitiesVisibility.set(communityContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...tests.fake.community.communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(accounts[5]);
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(communityContract.address);

        beneficiaryAdd.resetHistory();
        beneficiaryTransactionAdd.resetHistory();
        //
        subscribers.stop();
        await communityContract.addBeneficiary(accounts[5]);
        await cUSD
            .connect(provider.getSigner(5))
            .transfer(accounts[6], '2000000000000000000');
        subscribers.recover();
        await tests.config.utils.waitForStubCall(beneficiaryAdd, 1);
        await tests.config.utils.waitForStubCall(beneficiaryTransactionAdd, 1);
        assert.callCount(beneficiaryTransactionAdd, 1);
        assert.calledWith(beneficiaryTransactionAdd.getCall(0), {
            beneficiary: accounts[5],
            withAddress: accounts[6],
            amount: '2000000000000000000',
            isFromBeneficiary: true,
            tx: match.any,
            txAt: match.any,
        });
    });
});
