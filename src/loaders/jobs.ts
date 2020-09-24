import {
    updateImpactMarketCache,
    updateCommunityCache,
    subscribeChainEvents,
    startFromBlock,
} from '../jobs/chainSubscribers';
import config from '../config';
import { ethers } from 'ethers';
import CommunityService from '../db/services/community';
import { CronJob } from 'cron';
import { calcuateSSI } from '../jobs/calculateSSI';
import { prepareAgenda } from '../jobs/agenda';
import { updateExchangeRates } from '../jobs/updateExchangeRates';


export default async (): Promise<void> => {
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    cron(provider);
    await Promise.all([
        prepareAgenda(),
        subscribers(provider)
    ]);
};

async function subscribers(provider: ethers.providers.JsonRpcProvider): Promise<void> {
    const startFrom = await startFromBlock(provider, config.impactMarketContractBlockNumber);
    const fromLogs = await updateImpactMarketCache(provider, startFrom);
    fromLogs.forEach((community) => updateCommunityCache(
        community.block === undefined
            ? startFrom
            : community.block,
        provider,
        community.address
    ));
    // Because we are filtering events by address
    // when the community is created, the first manager
    // is actually added by impactmarket in an internal transaction.
    // This means that it's necessary to filter ManagerAdded with
    // impactmarket address.
    updateCommunityCache(startFrom, provider, config.impactMarketContractAddress);
    const availableCommunities = await CommunityService.getAll('valid');
    availableCommunities.forEach((community) => updateCommunityCache(startFrom, provider, community.contractAddress));
    subscribeChainEvents(provider, availableCommunities.map((community) => community.contractAddress));
}

function cron(provider: ethers.providers.JsonRpcProvider) {
    // everyday at midnight (Europe/Paris time)
    const jobCalculateSSI = new CronJob('0 0 * * *', () => {
        calcuateSSI(provider);
    }, null, false, 'Europe/Paris');
    jobCalculateSSI.start();
    if (config.fixerApiKey !== undefined && config.fixerApiKey.length > 0) {
        updateExchangeRates();
        // every three ours, update exchange rates
        const jobUpdateExchangeRates = new CronJob('0 */3 * * *', () => {
            updateExchangeRates();
        }, null, false);
        jobUpdateExchangeRates.start();
    }
}