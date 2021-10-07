import { expect } from 'chai';
import { ethers } from 'ethers';
import ganache from 'ganache-cli';

import { filterMerkleTree } from '../../../src/worker/jobs/cron/filters/merkleTree';
import MerkleTreeContractJSON from './MerkleTree.json';
import cUSDContractJSON from './cUSD.json';

describe('filterMerkleTree', () => {
    let provider: ethers.providers.Web3Provider;
    let accounts: string[] = [];
    const merkleTree: ethers.Contract[] = [];
    let cUSD: ethers.Contract;
    const ganacheProvider = ganache.provider({
        mnemonic:
            'alter toy tortoise hard lava aunt second lamp sister galaxy parent bargain',
    });

    before(async () => {
        provider = new ethers.providers.Web3Provider(ganacheProvider);
        accounts = await provider.listAccounts();

        const cUSDFactory = new ethers.ContractFactory(
            cUSDContractJSON.abi,
            cUSDContractJSON.bytecode,
            provider.getSigner(0)
        );
        const MerkleTreeFactory = new ethers.ContractFactory(
            MerkleTreeContractJSON.abi,
            MerkleTreeContractJSON.bytecode,
            provider.getSigner(0)
        );

        cUSD = await cUSDFactory.deploy();
        // we just need to send one address and one bytes32
        // doesn't really matter what's in them
        merkleTree.push(
            await MerkleTreeFactory.deploy(
                cUSD.address,
                ethers.utils.sha256(accounts[0])
            )
        );
        merkleTree.push(
            await MerkleTreeFactory.deploy(
                cUSD.address,
                ethers.utils.sha256(accounts[1])
            )
        );
    });

    after(() => {
        provider.removeAllListeners();
    });

    it('when only two are merkle tree', async () => {
        const isMerkleTree = await filterMerkleTree(
            provider,
            merkleTree.map((c) => c.address).concat(accounts.slice(2, 6))
        );
        expect(isMerkleTree).to.contain.members(
            merkleTree.map((c) => c.address)
        );
    });

    it('when all are merkle tree', async () => {
        const isMerkleTree = await filterMerkleTree(
            provider,
            merkleTree.map((c) => c.address)
        );
        expect(isMerkleTree).to.contain.members(
            merkleTree.map((c) => c.address)
        );
    });

    it('when none are merkle tree (one contract)', async () => {
        const isMerkleTree = await filterMerkleTree(
            provider,
            [cUSD.address].concat(accounts.slice(2, 6))
        );
        // eslint-disable-next-line no-unused-expressions
        expect(isMerkleTree).to.be.empty;
    });

    it('when none are merkle tree (no contract)', async () => {
        const isMerkleTree = await filterMerkleTree(
            provider,
            accounts.slice(2, 6)
        );
        // eslint-disable-next-line no-unused-expressions
        expect(isMerkleTree).to.be.empty;
    });
});
