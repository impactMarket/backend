import { parseEther } from '@ethersproject/units';
import {
    config,
    database,
    interfaces,
    services,
    tests,
} from '@impactmarket/core';
import { ethers } from 'ethers';
import ganache from 'ganache-cli';
import { assert, SinonStub, stub, restore, replace, match } from 'sinon';

import { ChainSubscribers } from '../../src/jobs/chainSubscribers';
import IPCTDelegateContractJSON from './IPCTDelegate.json';

describe('DAO', () => {
    let sequelize: database.Sequelize;
    let communitiesRegistry: interfaces.ubi.community.CommunityAttributes[];
    let provider: ethers.providers.Web3Provider;
    let subscribers: ChainSubscribers;
    let accounts: string[] = [];
    let IPCTDelegateContract: ethers.Contract;
    let communityUpdated: SinonStub<any, any>;
    let proposalUpdated: SinonStub<any, any>;
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
    let txResult: any;

    before(async () => {
        sequelize = tests.config.setup.sequelizeSetup();
        provider = new ethers.providers.Web3Provider(ganacheProvider);
        accounts = await provider.listAccounts();
        communityUpdated = stub(database.models.community, 'update');
        proposalUpdated = stub(database.models.appProposal, 'update');
        communityUpdated.returns(Promise.resolve([1, {} as any]));
        proposalUpdated.returns(Promise.resolve([1, {} as any]));
        replace(database.sequelize, 'transaction', sequelize.transaction);
        let lastBlock = 0;
        stub(services.app.ImMetadataService, 'setLastBlock').callsFake(
            async (v) => {
                lastBlock = v;
            }
        );
        stub(
            services.app.ImMetadataService,
            'setRecoverBlockUsingLastBlock'
        ).returns(Promise.resolve());
        getLastBlockStub = stub(services.app.ImMetadataService, 'getLastBlock');
        getRecoverBlockStub = stub(
            services.app.ImMetadataService,
            'getRecoverBlock'
        );
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
        communitiesRegistry = await tests.factories.CommunityFactory([
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
        await tests.config.setup.truncate(sequelize);
    });

    beforeEach(async () => {
        communityUpdated.resetHistory();
        proposalUpdated.resetHistory();
        const targets = [ethers.Wallet.createRandom().address];
        const values = [0];
        const signatures = [
            'addCommunity(address[],uint256,uint256,uint256,uint256,uint256,uint256,uint256)',
        ];

        const calldatas = [
            ethers.utils.defaultAbiCoder.encode(
                [
                    'address[]',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                ],
                [
                    [accounts[1]],
                    parseEther('1'),
                    parseEther('100'),
                    parseEther('0.01'),
                    5 * 60,
                    60,
                    '20000000000000000',
                    '5000000000000000000',
                ]
            ),
        ];

        const descriptions = 'description';

        const newProposal = await IPCTDelegateContract.connect(
            provider.getSigner(0)
        ).propose(targets, values, signatures, calldatas, descriptions);

        txResult = await newProposal.wait();
    });

    it('add proposal', async () => {
        await tests.config.utils.waitForStubCall(communityUpdated, 1);
        assert.callCount(communityUpdated, 1);
        assert.calledWith(
            communityUpdated.getCall(0),
            {
                proposalId: parseInt(txResult.events[0].args[0].toString(), 10),
            },
            {
                where: {
                    id: communitiesRegistry[1].id,
                },
                transaction: match.any,
            }
        );
    });

    it('queue proposal', async () => {
        await tests.config.utils.waitForStubCall(communityUpdated, 1);
        await IPCTDelegateContract.connect(provider.getSigner(0)).queue(
            parseInt(txResult.events[0].args[0].toString(), 10)
        );

        await tests.config.utils.waitForStubCall(proposalUpdated, 1);
        assert.callCount(proposalUpdated, 1);
        assert.calledWith(
            proposalUpdated.getCall(0),
            {
                status: 3,
                endBlock: match.number,
            },
            {
                where: {
                    id: parseInt(txResult.events[0].args[0].toString(), 10),
                },
            }
        );
    });

    it('cancel proposal', async () => {
        await tests.config.utils.waitForStubCall(communityUpdated, 1);
        await IPCTDelegateContract.connect(provider.getSigner(0)).cancel(
            parseInt(txResult.events[0].args[0].toString(), 10)
        );

        await tests.config.utils.waitForStubCall(proposalUpdated, 1);
        assert.callCount(proposalUpdated, 1);
        assert.calledWith(
            proposalUpdated.getCall(0),
            {
                status: 2,
            },
            {
                where: {
                    id: parseInt(txResult.events[0].args[0].toString(), 10),
                },
            }
        );
    });

    it('execute proposal', async () => {
        await tests.config.utils.waitForStubCall(communityUpdated, 1);
        await IPCTDelegateContract.connect(provider.getSigner(0)).execute(
            parseInt(txResult.events[0].args[0].toString(), 10)
        );

        await tests.config.utils.waitForStubCall(proposalUpdated, 1);
        assert.callCount(proposalUpdated, 1);
        assert.calledWith(
            proposalUpdated.getCall(0),
            {
                status: 1,
            },
            {
                where: {
                    id: parseInt(txResult.events[0].args[0].toString(), 10),
                },
            }
        );
    });
});
