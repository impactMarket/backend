import { parseEther } from '@ethersproject/units';
import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub, match, restore } from 'sinon';

import config from '../../../src/config';
import CommunityABI from '../../../src/contracts/CommunityABI.json';
import OldCommunityABI from '../../../src/contracts/OldCommunityABI.json';
import { models } from '../../../src/database';
import ImMetadataService from '../../../src/services/app/imMetadata';
import BeneficiaryService from '../../../src/services/ubi/beneficiary';
import CommunityService from '../../../src/services/ubi/community';
import CommunityContractService from '../../../src/services/ubi/communityContract';
import ManagerService from '../../../src/services/ubi/managers';
import { ChainSubscribers } from '../../../src/worker/jobs/chainSubscribers';
import { communityAddressesAndIds } from '../../fake/community';
import { waitForStubCall } from '../../utils';
import CommunityContractJSON from './CommunityContract.json';
import OldCommunityContractJSON from './OldCommunity.json';
import cUSDContractJSON from './cUSD.json';

describe('communityContract', () => {
    let provider: ethers.providers.Web3Provider;
    let subscribers: ChainSubscribers;
    let accounts: string[] = [];
    let CommunityContract: ethers.Contract;
    let CommunityOldContract: ethers.Contract;
    let communityUpdated: SinonStub<any, any>;
    let findCommunity: SinonStub<any, any>;
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
    let beneficiaryRemoved: SinonStub<any, any>;
    let managerAdd: SinonStub<any, any>;
    let managerRemove: SinonStub<any, any>;
    let managerUpdate: SinonStub<any, any>;
    let beneficiaryParamsUpdate: SinonStub<any, any>;
    let communityLock: SinonStub<any, any>;
    let getAllAddressesAndIds: SinonStub<any, any>;
    let cUSD: ethers.Contract;

    const thisCommunityPublicId = 'dc5b4ac6-2fc1-4f14-951a-fae2dcd904bd';
    const thisCommunityId = 1;
    const thisCommunityPublicId2 = 'dc5b4ac6-2fc1-4f14-951a-fae2dcd904bc';
    const thisCommunityId2 = 2;

    before(async () => {
        provider = new ethers.providers.Web3Provider(ganacheProvider);
        accounts = await provider.listAccounts();
        communityUpdated = stub(models.community, 'update');
        communityUpdated.returns(Promise.resolve([1, {} as any]));
        findCommunity = stub(models.community, 'findOne');
        findCommunity.returns(Promise.resolve({ publicId: 'public-id' }));
        beneficiaryAdd = stub(BeneficiaryService, 'add');
        beneficiaryAdd.returns(Promise.resolve(true));
        beneficiaryRemoved = stub(BeneficiaryService, 'remove');
        beneficiaryRemoved.returns(Promise.resolve(true));
        managerAdd = stub(ManagerService, 'add');
        managerAdd.returns(Promise.resolve(true));
        managerRemove = stub(ManagerService, 'remove');
        managerRemove.returns(Promise.resolve(true));
        managerUpdate = stub(models.manager, 'update');
        managerUpdate.returns(Promise.resolve(true));
        communityLock = stub(models.ubiCommunityContract, 'update');
        communityLock.returns(Promise.resolve(true));
        beneficiaryParamsUpdate = stub(CommunityContractService, 'update');
        beneficiaryParamsUpdate.returns(Promise.resolve(true));

        let lastBlock = 0;

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

        const cUSDFactory = new ethers.ContractFactory(
            cUSDContractJSON.abi,
            cUSDContractJSON.bytecode,
            provider.getSigner(0)
        );
        cUSD = await cUSDFactory.deploy();
        stub(config, 'cUSDContractAddress').value(cUSD.address);

        CommunityContractFactory = new ethers.ContractFactory(
            CommunityABI,
            CommunityContractJSON.bytecode,
            provider.getSigner(0)
        );

        const CommunityOldContractFactory = new ethers.ContractFactory(
            OldCommunityABI,
            OldCommunityContractJSON.bytecode,
            provider.getSigner(0)
        );

        CommunityContract = (
            await CommunityContractFactory.deploy(
                [accounts[1]],
                parseEther('1').toString(),
                parseEther('150').toString(),
                parseEther('0.01').toString(),
                86400,
                300,
                parseEther('0.02').toString(),
                parseEther('15').toString(),
                '0x0000000000000000000000000000000000000000'
            )
        ).connect(provider.getSigner(1));

        CommunityOldContract = (
            await CommunityOldContractFactory.deploy(
                accounts[1],
                parseEther('1').toString(),
                parseEther('150').toString(),
                86400,
                300,
                '0x0000000000000000000000000000000000000000',
                cUSD.address,
                '0x0000000000000000000000000000000000000000'
            )
        ).connect(provider.getSigner(1));

        await cUSD
            .connect(provider.getSigner(0))
            .testFakeFundAddress(CommunityOldContract.address);

        communities.set(CommunityContract.address, thisCommunityPublicId);
        communitiesId.set(CommunityContract.address, thisCommunityId);
        communities.set(CommunityOldContract.address, thisCommunityPublicId2);
        communitiesId.set(CommunityOldContract.address, thisCommunityId2);
        communitiesVisibility.set(CommunityContract.address, true);
        communitiesVisibility.set(CommunityOldContract.address, true);
        const newCommunityAddressesAndIds = new Map([
            ...communityAddressesAndIds,
            [CommunityContract.address, thisCommunityPublicId],
            [CommunityOldContract.address, thisCommunityPublicId2],
        ]);
        getAllAddressesAndIds = stub(CommunityService, 'getAllAddressesAndIds');
        getAllAddressesAndIds.returns(
            Promise.resolve(newCommunityAddressesAndIds)
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
        communityLock.reset();
        beneficiaryAdd.reset();
        managerAdd.reset();
        managerUpdate.reset();
    });

    it('add beneficiary', async () => {
        await CommunityContract.addBeneficiary(accounts[2]);
        await waitForStubCall(beneficiaryAdd, 1);
        assert.callCount(beneficiaryAdd, 1);
        assert.calledWith(
            beneficiaryAdd.getCall(0),
            accounts[2],
            accounts[1],
            thisCommunityId,
            match.any,
            match.any
        );
    });

    it('add (old) beneficiary', async () => {
        await CommunityOldContract.addBeneficiary(accounts[2]);
        await waitForStubCall(beneficiaryAdd, 1);
        assert.callCount(beneficiaryAdd, 1);
        assert.calledWith(
            beneficiaryAdd.getCall(0),
            accounts[2],
            accounts[1],
            thisCommunityId2,
            match.any,
            match.any
        );
    });

    it('remove beneficiary', async () => {
        await CommunityContract.addBeneficiary(accounts[2]);
        await waitForStubCall(beneficiaryAdd, 1);

        await CommunityContract.removeBeneficiary(accounts[2]);
        await waitForStubCall(beneficiaryRemoved, 1);
        assert.callCount(beneficiaryRemoved, 1);
        assert.calledWith(
            beneficiaryRemoved.getCall(0),
            accounts[2],
            accounts[1],
            thisCommunityId,
            match.any,
            match.any
        );
    });

    it('add manager', async () => {
        await CommunityContract.addManager(accounts[3]);
        await waitForStubCall(managerAdd, 1);
        assert.callCount(managerAdd, 1);
        assert.calledWith(managerAdd.getCall(0), accounts[3], thisCommunityId);
    });

    it('add (old) manager', async () => {
        await CommunityOldContract.addManager(accounts[3]);
        await waitForStubCall(managerAdd, 1);
        assert.callCount(managerAdd, 1);
        assert.calledWith(managerAdd.getCall(0), accounts[3], thisCommunityId2);
    });

    it('remove menager', async () => {
        await CommunityContract.addManager(accounts[3]);
        await waitForStubCall(managerAdd, 1);

        await CommunityContract.removeManager(accounts[3]);
        await waitForStubCall(managerRemove, 1);
        assert.callCount(managerRemove, 1);
        assert.calledWith(
            managerRemove.getCall(0),
            accounts[3],
            thisCommunityId
        );
    });

    it('lock community', async () => {
        await CommunityContract.lock();
        await waitForStubCall(communityLock, 1);
        assert.callCount(communityLock, 1);
        assert.calledWith(
            communityLock.getCall(0),
            { blocked: true },
            {
                where: {
                    communityId: communitiesId.get(CommunityContract.address)!,
                },
            }
        );
    });

    it('unlock community', async () => {
        await CommunityContract.lock();
        await waitForStubCall(communityLock, 1);

        communityLock.reset();

        await CommunityContract.unlock();
        await waitForStubCall(communityLock, 1);
        assert.callCount(communityLock, 1);
        assert.calledWith(
            communityLock.getCall(0),
            { blocked: false },
            {
                where: {
                    communityId: thisCommunityId,
                },
            }
        );
    });

    it('update beneficiary params', async () => {
        await CommunityContract.updateBeneficiaryParams(
            parseEther('2').toString(),
            parseEther('160').toString(),
            parseEther('0.02').toString(),
            86400,
            300
        );
        await waitForStubCall(beneficiaryParamsUpdate, 1);
        assert.callCount(beneficiaryParamsUpdate, 1);
        assert.calledWith(beneficiaryParamsUpdate.getCall(0), thisCommunityId, {
            claimAmount: parseEther('2').toString(),
            maxClaim: parseEther('160').toString(),
            decreaseStep: parseEther('0.02').toString(),
            baseInterval: 86400,
            incrementInterval: 300,
        });
    });
});
