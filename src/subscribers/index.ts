import { ethers } from 'ethers';
import config from '../config';

import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'
import CommunityContractABI from '../contracts/CommunityABI.json'
import ContractAddresses from '../contracts/network.json';
import TransactionsService from '../services/transactions';


export default async function TransactionCacheSubscriber() {
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);
    const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);

    provider.getLogs({
        address: ContractAddresses.alfajores.ImpactMarket,
        fromBlock: 0, // TODO: get block number where it gets deployed
        toBlock: 'latest',
        topics: [
            ethers.utils.id("CommunityAdded(address)"),
            // ethers.utils.id("CommunityRemoved(address)"),
        ]
    }).then((logsImpactMarket) => {
        const eventsImpactMarket = logsImpactMarket.map((log) => ifaceImpactMarket.parseLog(log));
        for (let eim = 0; eim < eventsImpactMarket.length; eim += 1) {
            if (eventsImpactMarket[eim].name !== 'CommunityAdded') {
                continue;
            }
            provider.getLogs({
                address: eventsImpactMarket[eim].values._addr,
                fromBlock: 0, // TODO: get block number where it gets deployed
                toBlock: 'latest',
                topics: [
                    ethers.utils.id("BeneficiaryAdded(address)"),
                    // ethers.utils.id("BeneficiaryRemoved(address)"),
                    // ethers.utils.id("BeneficiaryClaim(address,uint256)"),
                ]
            }).then(async (logsCommunity) => {
                const eventsCommunity = logsCommunity.map((log) => ifaceCommunity.parseLog(log));
                // save community events
                for (let ec = 0; ec < eventsCommunity.length; ec += 1) {
                    TransactionsService.add(
                        logsCommunity[ec].transactionHash!,
                        (await provider.getTransactionReceipt(logsCommunity[ec].transactionHash!)).from!,
                        logsCommunity[ec].address,
                        eventsCommunity[ec].name,
                        eventsCommunity[ec].values,
                    ).catch((error) => {
                        // that's fine if it is a SequelizeUniqueConstraintError
                        // it's already there 👌
                        if (error.name !== 'SequelizeUniqueConstraintError') {
                            console.log(typeof error, error);
                        }
                    })
                }
            });
        }
    });
}