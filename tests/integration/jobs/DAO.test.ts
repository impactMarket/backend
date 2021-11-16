import { parseEther } from '@ethersproject/units';
import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub, restore } from 'sinon';

import config from '../../../src/config';
import { models, Sequelize } from '../../../src/database';
import { CommunityAttributes } from '../../../src/database/models/ubi/community';
import ImMetadataService from '../../../src/services/app/imMetadata';
import { ChainSubscribers } from '../../../src/worker/jobs/chainSubscribers';
import CommunityFactory from '../../factories/community';
import { waitForStubCall } from '../../utils';
import truncate, { sequelizeSetup } from '../../utils/sequelizeSetup';
import IPCTDelegateContractJSON from './IPCTDelegate.json';

describe('DAO', () => {
    let sequelize: Sequelize;
    let communitiesRegistry: CommunityAttributes[];
    let provider: ethers.providers.Web3Provider;
    let subscribers: ChainSubscribers;
    let accounts: string[] = [];
    let IPCTDelegateContract: ethers.Contract;
    let communityUpdated: SinonStub<any, any>;
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
        sequelize = sequelizeSetup();
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

        // two communities with same parameters on purpose
        // only the second one should be used to add proposal
        // as the only difference is the user address requesting
        communitiesRegistry = await CommunityFactory([
            {
                requestByAddress: accounts[0],
                contract: {
                    baseInterval: 5 * 60,
                    incrementInterval: 60,
                    claimAmount: parseEther('1').toString(),
                    maxClaim: parseEther('100').toString(),
                    communityId: 0,
                },
            },
            {
                requestByAddress: accounts[1],
                contract: {
                    baseInterval: 5 * 60,
                    incrementInterval: 60,
                    claimAmount: parseEther('1').toString(),
                    maxClaim: parseEther('100').toString(),
                    communityId: 1,
                },
            },
            {
                requestByAddress: accounts[2],
            },
        ]);
    });

    after(async () => {
        if (subscribers !== undefined) {
            subscribers.stop();
        }
        provider.removeAllListeners();
        restore();
        await truncate(sequelize);
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
                    accounts[1],
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
                    id: communitiesRegistry[1].id,
                },
            }
        );
    });
});
