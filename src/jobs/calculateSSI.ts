import CommunityService from "../db/services/community";
import TransactionsService from "../db/services/transactions";
import { groupBy } from "../utils";
import { Transactions } from "../db/models/transactions";
import CommunityContractABI from '../contracts/CommunityABI.json'
import { ethers } from "ethers";
import { CommunityInstance } from "../contracts/types";


async function calcuateSSI(provider: ethers.providers.JsonRpcProvider): Promise<void> {
    console.log('Calculating SSI...');
    const communities = await CommunityService.getAll('valid');

    communities.forEach(async (community) => {
        //
        const communityInstance = new ethers.Contract(
            community.contractAddress,
            CommunityContractABI,
            provider,
        ) as ethers.Contract & CommunityInstance;
        //
        const lastIntervals: number[] = [];
        const cooldowns: number[] = [];
        // get all claims
        const claims = await TransactionsService.getBeneficiariesCommunityClaims(community.contractAddress);
        // filter from those who happened in the last 24h
        // const claims = allClaims.filter((claim) => claim.txAt.getDate() - new Date().getDate() <= 24 * 60 * 60);
        // group by beneficiary ('from')
        for (const [k, v] of groupBy<Transactions>(claims, 'from')) {
            // filter by beneficiaries with at least 2 claims
            if (v.length > 1) {
                // calculate the difference
                const lastClaim = v[v.length - 1];
                const preLastClaim = v[v.length - 2];
                lastIntervals.push(preLastClaim.values._amount - lastClaim.values._amount);
                // get the needed time of each k to the next claim
                cooldowns.push((await communityInstance.cooldown(k)).toNumber());
            }
        }
        // calculate mean
        if (cooldowns.length > 1 && lastIntervals.length > 1) {
            //
            const meanIntervals = lastIntervals.reduce((a, b) => a + b, 0) / lastIntervals.length
            const meanCooldowns = cooldowns.reduce((a, b) => a + b, 0) / cooldowns.length
            const mean = meanIntervals / meanCooldowns - 1;
        }
        // 1a media / 2a media - 1
    });
    // TODO:
}


export {
    calcuateSSI,
}