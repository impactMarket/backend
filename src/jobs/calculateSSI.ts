import { ICommunityInfo } from "../types";
import CommunityService from "../services/community";
import TransactionsService from "../services/transactions";
import { ethers } from "ethers";
import SSIService from "../services/ssi";
import { median, mean } from 'mathjs';
import Logger from "../loaders/logger";


async function calcuateSSI(provider: ethers.providers.JsonRpcProvider): Promise<void> {
    Logger.info('Calculating SSI...');
    const communities = await CommunityService.getAll('valid');
    const calculateNewSSI = async (community: ICommunityInfo) => {
        const beneficiariesTimeToWait: number[] = [];
        const beneficiariesTimeWaited: number[] = [];

        const communityClaims = await TransactionsService.getBeneficiariesCommunityClaims(community.contractAddress);
        const beneficiaries = (await TransactionsService.getBeneficiariesInCommunity(community.contractAddress)).added;
        for (let b = 0; b < beneficiaries.length; b += 1) {
            const beneficiryAdddress = beneficiaries[b].address;
            const lastBeneficiaryClaim = await TransactionsService.getBeneficiariesLastClaim(beneficiryAdddress);
            if (lastBeneficiaryClaim === undefined) {
                continue;
            }
            // the first time you don't wait a single second, the second time, only base interval
            const timeToWait = parseInt(community.vars._baseInterval, 10) + (communityClaims.get(beneficiryAdddress)! - 2) * parseInt(community.vars._incrementInterval, 10);
            const timeWaited = Math.floor((lastBeneficiaryClaim[0].txAt.getTime() - lastBeneficiaryClaim[1].txAt.getTime()) / 1000) - timeToWait;
            beneficiariesTimeToWait.push(timeToWait);
            beneficiariesTimeWaited.push(timeWaited);
        }
        // calculate result
        Logger.verbose({ beneficiariesTimeToWait, beneficiariesTimeWaited });
        if (beneficiariesTimeToWait.length > 1 && beneficiariesTimeWaited.length > 1) {
            const meanTimeToWait = mean(beneficiariesTimeToWait);
            const madTimeWaited = median(beneficiariesTimeWaited);
            SSIService.add(community.publicId, new Date(), parseFloat(((madTimeWaited / meanTimeToWait) * 50 /* aka, 100 / 2 */).toFixed(2)));
        }
    }
    // for each community
    communities.forEach((community) => calculateNewSSI(community));
}


export {
    calcuateSSI,
}