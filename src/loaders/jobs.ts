import { CronJob } from 'cron';
import { ethers } from 'ethers';

import config from '../config';
import { prepareAgenda } from '../jobs/agenda';
import {
    // updateImpactMarketCache,
    checkCommunitiesOnChainEvents,
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
    let successfullAnswersAfterCrash = 0;
    let successfullAnswersAfterTxRegWarn = 0;
    let intervalWhenCrash: NodeJS.Timeout | undefined = undefined;
    let intervalWhenTxRegWarn: NodeJS.Timeout | undefined = undefined;
    let waitingForResponseAfterTxRegWarn = false;
    process.on('unhandledRejection', (error: any) => {
        // close all RPC connections and restart when available again
        const strError = JSON.stringify(error);
        Logger.error(strError);
        if (
            strError.indexOf('eth_') !== -1 && // any eth_ surely is related to the RPC
            strError.indexOf('SERVER_ERROR') !== -1 &&
            !waitingForResponseAfterCrash &&
            !waitingForResponseAfterTxRegWarn
        ) {
            waitingForResponseAfterCrash = true;
            provider.removeAllListeners();
            // if a second crash happen before recovering from the first
            // it will get here again. Clear past time interval
            // and start again.
            if (intervalWhenCrash !== undefined) {
                clearInterval(intervalWhenCrash);
            }
            intervalWhenCrash = setInterval(() => {
                provider.getBlockNumber().then(() => {
                    successfullAnswersAfterCrash += 1;
                    // require 5 successfull answers, to prevent two or more crashes in row
                    if (successfullAnswersAfterCrash < 5) {
                        Logger.error('Got ' + successfullAnswersAfterCrash + '/5 sucessfull responses form json rpc provider...');
                    } else {
                        Logger.error('Reconnecting json rpc provider...');
                        subscribers(provider);
                        clearInterval(intervalWhenCrash!);
                        intervalWhenCrash = undefined;
                        waitingForResponseAfterCrash = false;
                        // setTimeout(
                        //     () => (waitingForResponseAfterCrash = false),
                        //     2000
                        // );
                    }
                }).catch(() => {
                    Logger.error('Checking again if RPC is available...');
                    successfullAnswersAfterCrash = 0;
                });
            }, 2000);
        }
    });
    process.on('warning', (warning) => {
        if (warning.name === 'TxRegistryFailureWarning') {
            waitingForResponseAfterTxRegWarn = true;
            Logger.error('Restarting provider listeners after registry failure');
            provider.removeAllListeners();
            // if a second crash happen before recovering from the first
            // it will get here again. Clear past time interval
            // and start again.
            if (intervalWhenTxRegWarn !== undefined) {
                clearInterval(intervalWhenTxRegWarn);
            }
            intervalWhenTxRegWarn = setInterval(() => {
                Logger.error('Checking if RPC is available');
                provider.getBlockNumber().then(() => {
                    successfullAnswersAfterTxRegWarn += 1;
                    if (successfullAnswersAfterTxRegWarn < 5) {
                        Logger.error('Got ' + successfullAnswersAfterTxRegWarn + '/5 sucessfull responses form json rpc provider...');
                    } else {
                        subscribers(provider);
                        clearInterval(intervalWhenTxRegWarn!);
                        waitingForResponseAfterTxRegWarn = false;
                        // setTimeout(
                        //     () => (waitingForResponseAfterTxRegWarn = false),
                        //     2000
                        // );
                    }
                }).catch(() => {
                    Logger.error('Checking again if RPC is available...');
                    successfullAnswersAfterTxRegWarn = 0;
                });
            }, 2000);
        }
    })
    await Promise.all([prepareAgenda(), subscribers(provider)]);
};

async function subscribers(
    provider: ethers.providers.JsonRpcProvider
): Promise<void> {
    const startFrom = await ImMetadataService.getLastBlock() - 15; // start 15 blocks before
    // NEW: does not make sense to recover "lost community contracts" has in this case,
    // it would have not been added in the database.
    // const fromLogs = await updateImpactMarketCache(provider, startFrom);
    // fromLogs.forEach((community) =>
    //     updateCommunityCache(
    //         startFrom,
    //         provider,
    //         community
    //     )
    // );
    // Because we are filtering events by address
    // when the community is created, the first manager
    // is actually added by impactmarket in an internal transaction.
    // This means that it's necessary to filter ManagerAdded with
    // impactmarket address.
    // NEW: this also does not apply
    // updateCommunityCache(
    //     startFrom,
    //     provider,
    //     config.impactMarketContractAddress
    // );

    // get all available communities
    const availableCommunities = await CommunityService.getAll('valid', false);
    const publicCommunities = availableCommunities.filter(
        (c) => c.visibility === 'public'
    );
    let beneficiariesInPublicCommunities: string[] = [];
    // starting 10 blocks in the past, check if they have lost transactions
    Logger.info('Recovering past events...');
    for (let c = 0; c < publicCommunities.length; c += 1) {
        const inCommunity = await BeneficiaryService.listActiveInCommunity(
            publicCommunities[c].publicId
        );
        beneficiariesInPublicCommunities = beneficiariesInPublicCommunities.concat(
            inCommunity.map((b) => b.address)
        );
    }
    await checkCommunitiesOnChainEvents(startFrom, provider, availableCommunities, beneficiariesInPublicCommunities);
    // get beneficiaries in private communities, so we don't count them
    Logger.info('Starting subscribers...');
    for (let c = 0; c < publicCommunities.length; c += 1) {
        const inCommunity = await BeneficiaryService.listActiveInCommunity(
            publicCommunities[c].publicId
        );
        beneficiariesInPublicCommunities = beneficiariesInPublicCommunities.concat(
            inCommunity.map((b) => b.address)
        );
    }
    // start subscribers
    subscribeChainEvents(
        provider,
        new Map(
            availableCommunities.map((c) => [c.contractAddress!, c.publicId])
        ),
        new Map(
            availableCommunities.map((c) => [
                c.contractAddress!,
                c.visibility === 'public',
            ])
        ),
        beneficiariesInPublicCommunities
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
