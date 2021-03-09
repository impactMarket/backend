import BeneficiaryService from '@services/beneficiary';
import CommunityService from '@services/community';
import CronJobExecutedService from '@services/cronJobExecuted';
import GlobalDemographicsService from '@services/globalDemographics';
import { Logger } from '@utils/logger';
import { CronJob } from 'cron';
import { ethers } from 'ethers';

import config from '../config';
import { ChainSubscribers } from './jobs/chainSubscribers';
import {
    calcuateCommunitiesMetrics,
    populateCommunityDailyState,
    verifyCommunityFunds,
} from './jobs/cron/community';
import { calcuateGlobalMetrics } from './jobs/cron/global';
import { updateExchangeRates } from './jobs/cron/updateExchangeRates';

export default async (): Promise<void> => {
    cron();
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    let waitingForResponseAfterCrash = false;
    let successfullAnswersAfterCrash = 0;
    let successfullAnswersAfterTxRegWarn = 0;
    let intervalWhenCrash: NodeJS.Timeout | undefined = undefined;
    let intervalWhenTxRegWarn: NodeJS.Timeout | undefined = undefined;
    let waitingForResponseAfterTxRegWarn = false;

    const availableCommunities = await CommunityService.listCommunitiesStructOnly();
    const beneficiariesInPublicCommunities = await BeneficiaryService.getAllAddressesInPublicValidCommunities();
    const subscribers = new ChainSubscribers(
        provider,
        beneficiariesInPublicCommunities,
        new Map(
            availableCommunities.map((c) => [c.contractAddress!, c.publicId])
        ),
        new Map(
            availableCommunities.map((c) => [
                c.contractAddress!,
                c.visibility === 'public',
            ])
        )
    );

    process.on('unhandledRejection', (error: any) => {
        // close all RPC connections and restart when available again
        const strError = JSON.stringify(error);
        Logger.error(strError);
        if (
            strError.indexOf('eth_') !== -1 && // any eth_ surely is related to the RPC
            (strError.indexOf('figment') !== -1 ||
                strError.indexOf('celo') !== -1) &&
            !waitingForResponseAfterCrash &&
            !waitingForResponseAfterTxRegWarn
        ) {
            waitingForResponseAfterCrash = true;
            subscribers.stop();
            // if a second crash happen before recovering from the first
            // it will get here again. Clear past time interval
            // and start again.
            if (intervalWhenCrash !== undefined) {
                clearInterval(intervalWhenCrash);
            }
            intervalWhenCrash = setInterval(() => {
                provider
                    .getBlockNumber()
                    .then(() => {
                        successfullAnswersAfterCrash += 1;
                        // require 5 successfull answers, to prevent two or more crashes in row
                        if (successfullAnswersAfterCrash < 5) {
                            Logger.error(
                                'Got ' +
                                    successfullAnswersAfterCrash +
                                    '/5 sucessfull responses form json rpc provider...'
                            );
                        } else {
                            Logger.error('Reconnecting json rpc provider...');
                            subscribers.recover();
                            clearInterval(intervalWhenCrash!);
                            intervalWhenCrash = undefined;
                            waitingForResponseAfterCrash = false;
                        }
                    })
                    .catch(() => {
                        Logger.error('Checking again if RPC is available...');
                        successfullAnswersAfterCrash = 0;
                    });
            }, 2000);
        }
    });
    process.on('warning', (warning) => {
        if (warning.name === 'TxRegistryFailureWarning') {
            waitingForResponseAfterTxRegWarn = true;
            Logger.error(
                'Restarting provider listeners after registry failure'
            );
            subscribers.stop();
            // if a second crash happen before recovering from the first
            // it will get here again. Clear past time interval
            // and start again.
            if (intervalWhenTxRegWarn !== undefined) {
                clearInterval(intervalWhenTxRegWarn);
            }
            intervalWhenTxRegWarn = setInterval(() => {
                Logger.error('Checking if RPC is available');
                provider
                    .getBlockNumber()
                    .then(() => {
                        successfullAnswersAfterTxRegWarn += 1;
                        if (successfullAnswersAfterTxRegWarn < 5) {
                            Logger.error(
                                'Got ' +
                                    successfullAnswersAfterTxRegWarn +
                                    '/5 sucessfull responses form json rpc provider...'
                            );
                        } else {
                            subscribers.recover();
                            clearInterval(intervalWhenTxRegWarn!);
                            waitingForResponseAfterTxRegWarn = false;
                        }
                    })
                    .catch(() => {
                        Logger.error('Checking again if RPC is available...');
                        successfullAnswersAfterTxRegWarn = 0;
                    });
            }, 2000);
        }
    });
};

/**
 * This method starts all cron jobs. Cron jobs jave specific times to happen.
 * They all follow the API timezone, which should be UTC, same as postgresql.
 */
function cron() {
    // multiple times a day

    // every hour, update exchange rates
    if (
        config.currenciesApiKey !== undefined &&
        config.currenciesApiKey.length > 0
    ) {
        updateExchangeRates();
        new CronJob(
            '25 * * * *',
            () => {
                updateExchangeRates()
                    .then(() => {
                        CronJobExecutedService.add('updateExchangeRates');
                        Logger.info(
                            'updateExchangeRates successfully executed!'
                        );
                    })
                    .catch((e) => {
                        Logger.error('updateExchangeRates FAILED!', e);
                    });
            },
            null,
            true
        );
    }

    // every eight hours, verify community funds
    new CronJob(
        '45 */8 * * *',
        () => {
            verifyCommunityFunds()
                .then(() => {
                    CronJobExecutedService.add('verifyCommunityFunds');
                    Logger.info('verifyCommunityFunds successfully executed!');
                })
                .catch((e) => {
                    Logger.error('verifyCommunityFunds FAILED!', e);
                });
        },
        null,
        true
    );

    // once a day

    // everyday at midnight
    new CronJob(
        '0 0 * * *',
        () => {
            Logger.info('Calculating community metrics...');
            calcuateCommunitiesMetrics()
                .then(() => {
                    CronJobExecutedService.add('calcuateCommunitiesMetrics');
                    Logger.info('Calculating global metrics...');
                    calcuateGlobalMetrics()
                        .then(() => {
                            CronJobExecutedService.add('calcuateGlobalMetrics');
                            Logger.info(
                                'calcuateGlobalMetrics successfully executed!'
                            );
                        })
                        .catch((e) => {
                            Logger.error('calcuateGlobalMetrics FAILED!', e);
                        });
                    Logger.info(
                        'calcuateCommunitiesMetrics successfully executed!'
                    );
                })
                .catch((e) => {
                    Logger.error('calcuateCommunitiesMetrics FAILED!', e);
                });
        },
        null,
        true
    );

    new CronJob(
        '0 0 * * *',
        () => {
            GlobalDemographicsService.calculateDemographics()
                .then(() => {
                    CronJobExecutedService.add('calculateDemographics');
                    Logger.info('calculateDemographics successfully executed!');
                })
                .catch((e) => {
                    Logger.error('calculateDemographics FAILED!', e);
                });
        },
        null,
        true
    );

    // everyday at 3:35pm (odd times), insert community daily rows with 5 days in advance
    new CronJob(
        '35 15 * * *',
        () => {
            populateCommunityDailyState()
                .then(() => {
                    CronJobExecutedService.add('populateCommunityDailyState');
                    Logger.info(
                        'populateCommunityDailyState successfully executed!'
                    );
                })
                .catch((e) => {
                    Logger.error('populateCommunityDailyState FAILED!', e);
                });
        },
        null,
        true
    );
}
