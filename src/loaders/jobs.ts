import { CronJob } from 'cron';
import { ethers } from 'ethers';

import config from '../config';
import { prepareAgenda } from '../jobs/agenda';
import {
    updateImpactMarketCache,
    updateCommunityCache,
    subscribeChainEvents,
} from '../jobs/chainSubscribers';
import {
    calcuateCommunitiesMetrics,
    populateCommunityDailyState,
    verifyCommunityFunds,
} from '../jobs/cron/community';
import { calcuateGlobalMetrics } from '../jobs/cron/global';
import { updateExchangeRates } from '../jobs/cron/updateExchangeRates';
import BeneficiaryService from '../services/beneficiary';
import CommunityService from '../services/community';
import CronJobExecutedService from '../services/cronJobExecuted';
import ImMetadataService from '../services/imMetadata';
import { Logger } from './logger';

export default async (): Promise<void> => {
    await cron();
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    let waitingForResponseAfterCrash = false;
    process.on('unhandledRejection', (error: any) => {
        // close all RPC connections and restart when available again
        const strError = JSON.stringify(error);
        Logger.error(strError);
        if (
            strError.indexOf('eth_blockNumber') !== -1 &&
            strError.indexOf('SERVER_ERROR') !== -1 &&
            !waitingForResponseAfterCrash
        ) {
            provider.removeAllListeners();
            waitingForResponseAfterCrash = true;
            const intervalObj = setInterval(() => {
                Logger.error('Checking if RPC is available again');
                provider.getBlockNumber().then(() => {
                    Logger.error('Reconnecting...');
                    subscribers(provider);
                    clearInterval(intervalObj);
                    setTimeout(
                        () => (waitingForResponseAfterCrash = false),
                        2000
                    );
                });
            }, 2000);
        }
    });
    await Promise.all([prepareAgenda(), subscribers(provider)]);
};

async function subscribers(
    provider: ethers.providers.JsonRpcProvider
): Promise<void> {
    const startFrom = await ImMetadataService.getLastBlock();
    const fromLogs = await updateImpactMarketCache(provider, startFrom);
    fromLogs.forEach((community) =>
        updateCommunityCache(
            community.block === undefined ? startFrom : community.block,
            provider,
            community.address
        )
    );
    // Because we are filtering events by address
    // when the community is created, the first manager
    // is actually added by impactmarket in an internal transaction.
    // This means that it's necessary to filter ManagerAdded with
    // impactmarket address.
    updateCommunityCache(
        startFrom,
        provider,
        config.impactMarketContractAddress
    );
    const availableCommunities = await CommunityService.getAll('valid', false);
    let beneficiariesInPrivateCommunities: string[] = [];
    const privateCommunities = availableCommunities.filter(
        (c) => c.visibility === 'private'
    );
    for (let c = 0; c < privateCommunities.length; c += 1) {
        const inCommunity = await BeneficiaryService.getAllInCommunity(
            privateCommunities[c].publicId
        );
        beneficiariesInPrivateCommunities = beneficiariesInPrivateCommunities.concat(
            inCommunity.map((b) => b.address)
        );
    }
    availableCommunities.forEach((community) =>
        updateCommunityCache(startFrom, provider, community.contractAddress)
    );
    subscribeChainEvents(
        provider,
        new Map(
            availableCommunities.map((c) => [c.contractAddress, c.publicId])
        ),
        new Map(
            availableCommunities.map((c) => [
                c.contractAddress,
                c.visibility === 'public',
            ])
        ),
        beneficiariesInPrivateCommunities
    );
}

/**
 * This method starts all cron jobs. Cron jobs jave specific times to happen.
 * They all follow the API timezone, which should be UTC, same as postgresql.
 */
async function cron() {
    // multiple times a day

    // every three hours, update exchange rates
    if (
        config.currenciesApiKey !== undefined &&
        config.currenciesApiKey.length > 0
    ) {
        updateExchangeRates();
        new CronJob(
            '25 */3 * * *',
            async () => {
                await updateExchangeRates();
                CronJobExecutedService.add('updateExchangeRates');
                Logger.info('updateExchangeRates successfully executed!');
            },
            null,
            true
        );
    }

    // every four hours, verify community funds
    new CronJob(
        '45 */4 * * *',
        async () => {
            await verifyCommunityFunds();
            CronJobExecutedService.add('verifyCommunityFunds');
            Logger.info('verifyCommunityFunds successfully executed!');
        },
        null,
        true
    );

    // once a day

    // everyday at midnight
    new CronJob(
        '0 0 * * *',
        async () => {
            await calcuateCommunitiesMetrics();
            await calcuateGlobalMetrics();
            CronJobExecutedService.add('calcuateMetrics');
            Logger.info('calcuateMetrics successfully executed!');
        },
        null,
        true
    );

    // everyday at 3:35pm (odd times), insert community daily rows with 5 days in advance
    new CronJob(
        '35 15 * * *',
        async () => {
            await populateCommunityDailyState();
            CronJobExecutedService.add('populateCommunityDailyState');
            Logger.info('populateCommunityDailyState successfully executed!');
        },
        null,
        true
    );
}
