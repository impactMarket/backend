import { parseEther } from '@ethersproject/units';
import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub, restore } from 'sinon';

import config from '../../../src/config';
import { models } from '../../../src/database';
import ImMetadataService from '../../../src/services/app/imMetadata';
import { ChainSubscribers } from '../../../src/worker/jobs/chainSubscribers';
import { waitForStubCall } from '../../utils';
import IPCTDelegateContractJSON from './IPCTDelegate.json';

describe('DAO', () => {
    let provider: ethers.providers.Web3Provider;
    let subscribers: ChainSubscribers;
    let accounts: string[] = [];
    let IPCTDelegateContract: ethers.Contract;
    let communityUpdated: SinonStub<any, any>;
    let findCommunity: SinonStub<any, any>;
    let IPCTDelegateFactory: ethers.ContractFactory;
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
        findCommunity.returns(Promise.resolve({ id: 1 }));
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

        IPCTDelegateFactory = new ethers.ContractFactory(
            IPCTDelegateContractJSON.abi,
            IPCTDelegateContractJSON.bytecode,
            provider.getSigner(0)
        );

        IPCTDelegateContract = await IPCTDelegateFactory.deploy();

        stub(config, 'DAOContractAddress').value(IPCTDelegateContract.address);

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

    it('add proposal', async () => {
        const targets = [ethers.Wallet.createRandom().address];
        const values = [0];
        const signatures = [
            'addCommunity(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address[])',
        ];

        const calldatas = [
            ethers.utils.defaultAbiCoder.encode(
                [
                    'address',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'address[]',
                ],
                [
                    accounts[0],
                    parseEther('1'),
                    parseEther('100'),
                    parseEther('0.01'),
                    5 * 60,
                    60,
                    '20000000000000000',
                    '5000000000000000000',
                    [],
                ]
            ),
        ];

        const descriptions = 'description';

        const newProposal = await IPCTDelegateContract.connect(
            provider.getSigner(0)
        ).propose(targets, values, signatures, calldatas, descriptions);

        const txResult = await newProposal.wait();
        await waitForStubCall(communityUpdated, 1);
        assert.callCount(communityUpdated, 1);
        assert.calledWith(
            communityUpdated.getCall(0),
            {
                proposal: txResult.events[0].args[0],
            },
            {
                where: {
                    id: 1,
                },
            }
        );
    });
});
