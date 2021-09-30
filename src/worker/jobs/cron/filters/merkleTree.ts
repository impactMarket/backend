import config from 'config';
import { providers, Contract } from 'ethers';

/**
 * Returned addresses are merkle trees.
 * @returns {Promise<string[]>}
 */
export async function filterMerkleTree(addresses: string[]): Promise<string[]> {
    const MerkleABI = [
        {
            type: 'function',
            stateMutability: 'view',
            outputs: [{ type: 'bytes32', name: '', internalType: 'bytes32' }],
            name: 'merkleRoot',
            inputs: [],
        },
    ];
    const provider = new providers.JsonRpcProvider(config.jsonRpcUrl);
    const trees: string[] = [];
    for (let index = 0; index < addresses.length; index++) {
        const merkle = new Contract(addresses[index], MerkleABI, provider);
        try {
            await merkle.merkleRoot();
            trees.push(addresses[index]);
        } catch (_) {
            // Merkle tree not found
        }
    }
    return trees;
}
