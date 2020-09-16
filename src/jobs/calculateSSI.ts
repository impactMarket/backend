import { ICommunityInfo } from "../types";
import CommunityService from "../db/services/community";
import TransactionsService from "../db/services/transactions";
import { ethers } from "ethers";
import SSIService from "../db/services/ssi";


async function calcuateSSI(provider: ethers.providers.JsonRpcProvider): Promise<void> {
    console.log('Calculating SSI...');
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
            console.log('timeWaited', timeWaited);
            beneficiariesTimeToWait.push(timeToWait);
            beneficiariesTimeWaited.push(timeWaited);
        }
        // calculate mean
        console.log(beneficiariesTimeToWait, beneficiariesTimeWaited);
        if (beneficiariesTimeToWait.length > 1 && beneficiariesTimeWaited.length > 1) {
            const meanTimeToWait = beneficiariesTimeToWait.reduce((a, b) => a + b, 0) / beneficiariesTimeToWait.length;
            const meanTimeWaited = beneficiariesTimeWaited.reduce((a, b) => a + b, 0) / beneficiariesTimeWaited.length;
            console.log(parseFloat(((meanTimeWaited / meanTimeToWait) * 100).toFixed(2)))
            SSIService.add(community.publicId, new Date(), parseFloat(((meanTimeWaited / meanTimeToWait) * 100).toFixed(2)));
        }
    }
    // for each community
    communities.forEach((community) => {
        // // get date of the last ssi
        // const lastSSI = await SSIService.last(community.publicId);
        // // if there's no ssi, get the oldest claim
        // if (lastSSI === undefined) {
        //     // TODO: add option to calculate past ssi
        //     const lastClaim = await TransactionsService.getLastClaim(community.contractAddress);
        //     if (lastClaim === undefined) {
        //         return;
        //     }
        //     // if older than 24h, it's necessary to calculate historical data. Get midnight that day, calculate and interate until the end
        //     if (lastClaim.txAt.getTime() < new Date().getTime() - 86400000) {
        //         // TODO: complete
        //     }
        //     // if not, don't do anything
        // } else {

        // }
        calculateNewSSI(community);
    });
}


export {
    calcuateSSI,
}