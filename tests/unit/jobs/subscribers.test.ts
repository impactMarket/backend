import { ethers } from 'ethers';
import ganache from 'ganache-cli';
// import { Transaction } from 'sequelize';
import { stub, assert, match, SinonStub, spy, SinonSpy, restore } from 'sinon';
import { models } from '../../../src/database';

// import { Beneficiary } from '../../../src/database/models/ubi/beneficiary';
import { Community } from '../../../src/database/models/ubi/community';
import ImMetadataService from '../../../src/services/app/imMetadata';
import BeneficiaryService from '../../../src/services/ubi/beneficiary';
import ClaimsService from '../../../src/services/ubi/claim';
import CommunityService from '../../../src/services/ubi/community';
import CommunityContractService from '../../../src/services/ubi/communityContract';
import InflowService from '../../../src/services/ubi/inflow';
import ManagerService from '../../../src/services/ubi/managers';
import * as utils from '../../../src/utils/util';
import { ChainSubscribers } from '../../../src/worker/jobs/chainSubscribers';
import { communityAddressesAndIds } from '../../fake/community';
import { waitForStubCall } from '../../utils';
import CommunityContractJSON from './Community.json';
import cUSDContractJSON from './cUSD.json';
import DAOContractJSON from './DAO.json';
import config from '../../../src/config';

describe('[jobs] subscribers', () => {
    const blockTimeDate = new Date();
    let provider: ethers.providers.Web3Provider;
    let communityContract: ethers.Contract;
    let DAOContract: ethers.Contract;
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
    let DAOFactory: ethers.ContractFactory;
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
        stub(utils, 'notifyBeneficiaryAdded').returns(Promise.resolve(true));
        stub(utils, 'getBlockTime').returns(Promise.resolve(blockTimeDate));
        beneficiaryAdd = stub(BeneficiaryService, 'add');
        beneficiaryAdd.returns(Promise.resolve(true));
        beneficiaryTransactionAdd = stub(BeneficiaryService, 'addTransaction');
        beneficiaryTransactionAdd.returns(Promise.resolve());
        beneficiaryRemove = stub(BeneficiaryService, 'remove');
        beneficiaryRemove.returns(Promise.resolve());
        inflowAdd = stub(InflowService, 'add');
        inflowAdd.returns(Promise.resolve());
        // stub(BeneficiaryService, 'getAllAddresses').returns(Promise.resolve(accounts.slice(5, 9)));
        // stub(Beneficiary, 'findAll').returns(Promise.resolve([]));
        stub(ImMetadataService, 'setLastBlock').callsFake(async (v) => {
            lastBlock = v;
        });
        stub(ImMetadataService, 'setRecoverBlockUsingLastBlock').returns(
            Promise.resolve()
        );
        stub(CommunityService, 'getCommunityOnlyByPublicId').returns(
            Promise.resolve({ id: thisCommunityId } as any)
        );
        getLastBlockStub = stub(ImMetadataService, 'getLastBlock');
        getRecoverBlockStub = stub(ImMetadataService, 'getRecoverBlock');
        getLastBlockStub.returns(Promise.resolve(lastBlock));
        getRecoverBlockStub.returns(Promise.resolve(lastBlock));
        claimAdd = stub(ClaimsService, 'add');
        claimAdd.returns(Promise.resolve());
        managerAdd = stub(ManagerService, 'add');
        managerAdd.returns(Promise.resolve(true));
        communityEdit = stub(CommunityContractService, 'update');
        communityEdit.returns(Promise.resolve(true));
        stub(models.community, 'findOne')
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
                } as Community)
            );
        managerRemove = stub(ManagerService, 'remove');
        managerRemove.returns(Promise.resolve());
        getAllAddressesAndIds = stub(CommunityService, 'getAllAddressesAndIds');
        getAllAddressesAndIds.returns(
            Promise.resolve(communityAddressesAndIds)
        );
        imMetadataRemoveRecoverSpy = spy(
            ImMetadataService,
            'removeRecoverBlock'
        );
        stub(CommunityService, 'getOnlyCommunityByContractAddress').returns(
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
            } as Community)
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
        DAOFactory = new ethers.ContractFactory(
            DAOContractJSON.abi,
            DAOContractJSON.bytecode,
            provider.getSigner(0)
        );
        
        cUSD = await cUSDFactory.deploy();

        DAOContract = (await DAOFactory.deploy(
            cUSD.address,
            accounts[1],
            accounts[1],
        )).connect(provider.getSigner(0));

        stub(config, 'DAOContractAddress').value(DAOContract.address);

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
            ...communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
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
        assert.calledWith(
            managerAdd.getCall(0),
            accounts[1],
            thisCommunityPublicId
        );
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
            ...communityAddressesAndIds,
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
        await waitForStubCall(communityEdit, 1);
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
            ...communityAddressesAndIds,
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
        await waitForStubCall(beneficiaryAdd, 1);
        assert.callCount(beneficiaryAdd, 1);
        assert.calledWith(
            beneficiaryAdd.getCall(0),
            accounts[5],
            accounts[1],
            thisCommunityPublicId,
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
            ...communityAddressesAndIds,
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
        await waitForStubCall(beneficiaryAdd, 1);
        await communityContract.removeBeneficiary(accounts[5]);
        await waitForStubCall(beneficiaryRemove, 1);
        assert.callCount(beneficiaryRemove, 1);
        assert.calledWith(
            beneficiaryRemove.getCall(0),
            accounts[5],
            accounts[1],
            thisCommunityPublicId,
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
            ...communityAddressesAndIds,
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
        await waitForStubCall(claimAdd, 1);
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
            ...communityAddressesAndIds,
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
        await waitForStubCall(managerAdd, 2);
        assert.callCount(managerAdd, 2);
        assert.calledWith(
            managerAdd.getCall(0),
            accounts[1],
            thisCommunityPublicId
        );
        assert.calledWith(
            managerAdd.getCall(1),
            accounts[2],
            thisCommunityPublicId
        );
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
            ...communityAddressesAndIds,
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
        await waitForStubCall(managerAdd, 2);
        await communityContract.removeManager(accounts[2]);
        await waitForStubCall(managerRemove, 1);
        assert.callCount(managerRemove, 1);
        assert.calledWith(
            managerRemove.getCall(0),
            accounts[2],
            thisCommunityPublicId
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
            ...communityAddressesAndIds,
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
        await waitForStubCall(inflowAdd, 1);
        assert.callCount(inflowAdd, 1);
        assert.calledWith(
            inflowAdd.getCall(0),
            accounts[2],
            communityContract.address,
            '2000000000000000000',
            match.any,
            match.any,
        );
    });

    it('donation: to DAO', async () => {
        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(accounts[3]);

        inflowAdd.reset();

        await cUSD
            .connect(provider.getSigner(3))
            .transfer(DAOContract.address, '2000000000000000000');
        await waitForStubCall(inflowAdd, 1);
        assert.callCount(inflowAdd, 1);
        assert.calledWith(
            inflowAdd.getCall(0),
            accounts[3],
            DAOContract.address,
            '2000000000000000000',
            match.any,
            match.any,
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
            ...communityAddressesAndIds,
            [communityContract.address, thisCommunityPublicId],
        ]);
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
        );
        await waitForStubCall(imMetadataRemoveRecoverSpy, 1);
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
        await waitForStubCall(beneficiaryAdd, 1);
        await cUSD
            .connect(provider.getSigner(7))
            .transfer(accounts[8], '2200000000000000000');
        await waitForStubCall(beneficiaryTransactionAdd, 1);
        assert.callCount(beneficiaryTransactionAdd, 1);
        assert.calledWith(beneficiaryTransactionAdd.getCall(0), {
            beneficiary: accounts[7],
            withAddress: accounts[8],
            amount: '2200000000000000000',
            isFromBeneficiary: true,
            tx: match.any,
            date: match.any,
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
            ...communityAddressesAndIds,
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
