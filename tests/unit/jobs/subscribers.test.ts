import { stub, assert, match, createStubInstance } from 'sinon';
import { ethers } from 'ethers';
import ganache from 'ganache-cli';

import * as utils from '../../../src/utils';
import BeneficiaryService from '../../../src/services/beneficiary';
import ImMetadataService from '../../../src/services/imMetadata';
import TransactionsService from '../../../src/services/transactions';
import { subscribeChainEvents } from '../../../src/jobs/chainSubscribers';
import CommunityContractJSON from './Community.json';
import cUSDContractJSON from './cUSD.json';

async function delay() {
    return new Promise((resolve) => setTimeout(() => {
        resolve();
    }, 5000));
}

describe('[jobs] subscribers', () => {
    const blockTimeDate = new Date();
    let provider: ethers.providers.Web3Provider;
    let communityContract: ethers.Contract;
    let communities = new Map<string, string>();
    let communitiesVisibility = new Map<string, boolean>();
    let accounts: string[] = [];
    let beneficiaryAdd;

    before(async () => {
        provider = new ethers.providers.Web3Provider(ganache.provider());
        accounts = await provider.listAccounts();
        stub(utils, 'notifyBeneficiaryAdded').returns(Promise.resolve(true));
        stub(utils, 'getBlockTime').returns(Promise.resolve(blockTimeDate));
        beneficiaryAdd = stub(BeneficiaryService, 'add')
        beneficiaryAdd.returns(Promise.resolve({} as any));
        stub(BeneficiaryService, 'getAllAddresses').returns(Promise.resolve(accounts.slice(5, 9)));
        stub(ImMetadataService, 'setLastBlock').returns(Promise.resolve());
        stub(TransactionsService, 'add').returns(Promise.resolve({} as any));

        const cUSDFactory = new ethers.ContractFactory(cUSDContractJSON.abi, cUSDContractJSON.bytecode, provider.getSigner(0));
        const communityFactory = new ethers.ContractFactory(CommunityContractJSON.abi, CommunityContractJSON.bytecode, provider.getSigner(0));
        const cUSD = await cUSDFactory.deploy();
        communityContract = (await communityFactory.deploy(
            accounts[1],
            '2000000000000000000',
            '1500000000000000000000',
            86400,
            300,
            '0x0000000000000000000000000000000000000000',
            cUSD.address,
            '0x0000000000000000000000000000000000000000'
        )).connect(provider.getSigner(1));
        communities.set(communityContract.address, 'dc5b4ac6-2fc1-4f14-951a-fae2dcd904bd');
        communitiesVisibility.set(communityContract.address, true);
        await cUSD.connect(provider.getSigner(0)).testFakeFundAddress(communityContract.address);
    });

    after(() => {
        provider.removeAllListeners();
    })

    it('#subscribeChainEvents()', async () => {
        // provider.emit()
        await subscribeChainEvents(provider, communities, communitiesVisibility, []);
        // await provider.getSigner(0).sendTransaction({
        //     to: provider.getSigner(1)._address,
        //     value: ethers.utils.parseEther("1.0")
        // })
        await communityContract.addBeneficiary(accounts[5]);

        await delay();

        assert.callCount(beneficiaryAdd, 1);
        assert.calledWith(beneficiaryAdd.getCall(0), accounts[5], 'dc5b4ac6-2fc1-4f14-951a-fae2dcd904bd', match.any);
    });
});