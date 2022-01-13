import { services, utils, config, database } from '@impactmarket/core';
import { CronJob } from 'cron';
import { ethers } from 'ethers';
import schedule from 'node-schedule';

import { ChainSubscribers } from './jobs/chainSubscribers';
import {
    calcuateCommunitiesMetrics,
    internalNotifyLowCommunityFunds,
    internalNotifyNewCommunities,
    verifyCommunitySuspectActivity,
} from './jobs/cron/community';
import { calcuateGlobalMetrics } from './jobs/cron/global';
import { cleanupNetworkRewards } from './jobs/cron/network';
import { verifyStoriesLifecycle } from './jobs/cron/stories';
import { updateExchangeRates } from './jobs/cron/updateExchangeRates';
import {
    verifyUserSuspectActivity,
    verifyDeletedAccounts,
} from './jobs/cron/user';

const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
const providerFallback = new ethers.providers.JsonRpcProvider(
    config.jsonRpcUrlFallback
);

let availableCommunities: database.Community[];
let beneficiaries: string[];
let subscribers: ChainSubscribers;
let usingFallbackUrl = false;
let waitingForResponseAfterCrash = false;
let successfullAnswersAfterCrash = 0;
let successfullAnswersAfterTxRegWarn = 0;
let failedAnswers = 0;
let intervalWhenCrash: NodeJS.Timeout | undefined = undefined;
let intervalWhenTxRegWarn: NodeJS.Timeout | undefined = undefined;
let waitingForResponseAfterTxRegWarn = false;

export default async (): Promise<void> => {
    cron();

    availableCommunities =
        await services.ubi.CommunityService.listCommunitiesStructOnly();
    beneficiaries = (
        await database.models.beneficiary.findAll({
            attributes: ['address'],
            include: [
                {
                    model: database.models.community,
                    as: 'community',
                    attributes: [],
                    where: { visibility: 'public', status: 'valid' },
                },
            ],
            where: {
                active: true,
            },
            raw: true,
        })
    ).map((b) => b.address);
    subscribers = startChainSubscriber();

    process.on('unhandledRejection', (error: any) => {
        // close all RPC connections and restart when available again
        const strError = JSON.stringify(error);
        utils.Logger.error(strError);
        if (
            strError.indexOf('eth_') !== -1 && // any eth_ surely is related to the RPC
            (strError.indexOf('figment') !== -1 ||
                strError.indexOf('celo') !== -1) &&
            !waitingForResponseAfterCrash &&
            !waitingForResponseAfterTxRegWarn
        ) {
            reconnectChainSubscriber();
        }
    });
    process.on('warning', (warning) => {
        if (warning.name === 'TxRegistryFailureWarning') {
            waitingForResponseAfterTxRegWarn = true;
            utils.Logger.error(
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
                utils.Logger.error('Checking if RPC is available');
                provider
                    .getBlockNumber()
                    .then(() => {
                        successfullAnswersAfterTxRegWarn += 1;
                        if (successfullAnswersAfterTxRegWarn < 5) {
                            utils.Logger.error(
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
                        utils.Logger.error(
                            'Checking again if RPC is available...'
                        );
                        successfullAnswersAfterTxRegWarn = 0;
                    });
            }, 2000);
        }
    });
};

function reconnectChainSubscriber() {
    waitingForResponseAfterCrash = true;
    subscribers.stop();
    // if a second crash happen before recovering from the first
    // it will get here again. Clear past time interval
    // and start again.
    if (intervalWhenCrash !== undefined) {
        clearInterval(intervalWhenCrash);
    }
    intervalWhenCrash = setInterval(() => {
        if (usingFallbackUrl) {
            providerFallback
                .getBlockNumber()
                .then(() => {
                    successfullAnswersAfterCrash += 1;
                    // require 5 successfull answers, to prevent two or more crashes in row
                    if (successfullAnswersAfterCrash < 5) {
                        utils.Logger.error(
                            'Got ' +
                                successfullAnswersAfterCrash +
                                '/5 sucessfull responses form json rpc provider (fallback)...'
                        );
                    } else {
                        utils.Logger.error(
                            'Reconnecting json rpc provider (fallback)...'
                        );
                        subscribers.recover();
                        clearInterval(intervalWhenCrash!);
                        intervalWhenCrash = undefined;
                        waitingForResponseAfterCrash = false;

                        // After 30 min, try to connect with the principal provider again
                        schedule.scheduleJob(Date.now() + 60000, () => {
                            utils.Logger.info(
                                'Conecting with the principal provider'
                            );
                            subscribers.stop();
                            subscribers = startChainSubscriber();
                            usingFallbackUrl = false;
                            failedAnswers = 0;
                            successfullAnswersAfterCrash = 0;
                            reconnectChainSubscriber();
                        });
                    }
                })
                .catch(() => {
                    if (failedAnswers > 5) {
                        utils.Logger.error('Try the principal provider');
                        subscribers = startChainSubscriber();
                        usingFallbackUrl = false;
                        failedAnswers = 0;
                    } else {
                        utils.Logger.error(
                            'Checking again if RPC (fallback) is available...'
                        );
                        successfullAnswersAfterCrash = 0;
                        failedAnswers += 1;
                    }
                });
        } else {
            provider
                .getBlockNumber()
                .then(() => {
                    successfullAnswersAfterCrash += 1;
                    // require 5 successfull answers, to prevent two or more crashes in row
                    if (successfullAnswersAfterCrash < 5) {
                        utils.Logger.error(
                            'Got ' +
                                successfullAnswersAfterCrash +
                                '/5 sucessfull responses form json rpc provider...'
                        );
                    } else {
                        utils.Logger.error('Reconnecting json rpc provider...');
                        subscribers.recover();
                        clearInterval(intervalWhenCrash!);
                        intervalWhenCrash = undefined;
                        waitingForResponseAfterCrash = false;
                    }
                })
                .catch(() => {
                    if (failedAnswers > 5) {
                        utils.Logger.error('Use fallback provider');
                        subscribers = startChainSubscriber(true);
                        usingFallbackUrl = true;
                        failedAnswers = 0;
                    } else {
                        utils.Logger.error(
                            'Checking again if RPC is available...'
                        );
                        successfullAnswersAfterCrash = 0;
                        failedAnswers += 1;
                    }
                });
        }
    }, 2000);
}

function startChainSubscriber(fallback?: boolean): ChainSubscribers {
    return new ChainSubscribers(
        fallback ? providerFallback : provider,
        beneficiaries,
        new Map(
            availableCommunities.map((c) => [c.contractAddress!, c.publicId])
        ),
        new Map(availableCommunities.map((c) => [c.contractAddress!, c.id])),
        new Map(
            availableCommunities.map((c) => [
                c.contractAddress!,
                c.visibility === 'public',
            ])
        )
    );
}

/**
 * This method starts all cron jobs. Cron jobs jave specific times to happen.
 * They all follow the API timezone, which should be UTC, same as postgresql.
 */
function cron() {
    // multiple times a day

    // every four hour, update exchange rates
    if (
        config.currenciesApiKey !== undefined &&
        config.currenciesApiKey.length > 3 // allow to use any single char in staging env
    ) {
        updateExchangeRates();
        // eslint-disable-next-line no-new
        new CronJob(
            '25 */4 * * *',
            () => {
                updateExchangeRates()
                    .then(() => {
                        services.app.CronJobExecutedService.add(
                            'updateExchangeRates'
                        );
                        utils.Logger.info(
                            'updateExchangeRates successfully executed!'
                        );
                    })
                    .catch((e) => {
                        utils.Logger.error('updateExchangeRates FAILED! ' + e);
                    });
            },
            null,
            true
        );
    }

    // every eight hours, verify community funds
    // eslint-disable-next-line no-new
    // TODO: we internally decided to turn this off for a while.
    // A new better mechanism will replace this.
    // new CronJob(
    //     '45 */8 * * *',
    //     () => {
    //         verifyCommunityFunds()
    //             .then(() => {
    //                 services.app.CronJobExecutedService.add('verifyCommunityFunds');
    //                 utils.Logger.info('verifyCommunityFunds successfully executed!');
    //             })
    //             .catch((e) => {
    //                 utils.Logger.error('verifyCommunityFunds FAILED! ' + e);
    //             });
    //     },
    //     null,
    //     true
    // );

    if (config.internalNotifications) {
        try {
            // at 7:12pm
            // eslint-disable-next-line no-new
            new CronJob(
                '12 19 * * *',
                () => {
                    internalNotifyLowCommunityFunds()
                        .then(() => {
                            services.app.CronJobExecutedService.add(
                                'internalNotifyLowCommunityFunds'
                            );
                            utils.Logger.info(
                                'internalNotifyLowCommunityFunds successfully executed!'
                            );
                        })
                        .catch((e) => {
                            utils.Logger.error(
                                'internalNotifyLowCommunityFunds FAILED! ' + e
                            );
                        });
                },
                null,
                true
            );
        } catch (_) {}

        try {
            // at 7:30am on Wednesday
            // eslint-disable-next-line no-new
            new CronJob(
                '30 7 * * 3',
                () => {
                    internalNotifyNewCommunities()
                        .then(() => {
                            services.app.CronJobExecutedService.add(
                                'internalNotifyNewCommunities'
                            );
                            utils.Logger.info(
                                'internalNotifyNewCommunities successfully executed!'
                            );
                        })
                        .catch((e) => {
                            utils.Logger.error(
                                'internalNotifyNewCommunities FAILED! ' + e
                            );
                        });
                },
                null,
                true
            );
        } catch (_) {}
    }

    // once a day

    // everyday at midnight
    // eslint-disable-next-line no-new
    new CronJob(
        '0 0 * * *',
        () => {
            utils.Logger.info('Calculating community metrics...');
            cleanupNetworkRewards()
                .then(() => {
                    services.app.CronJobExecutedService.add(
                        'cleanupNetworkRewards'
                    );
                    calcuateCommunitiesMetrics()
                        .then(() => {
                            services.app.CronJobExecutedService.add(
                                'calcuateCommunitiesMetrics'
                            );
                            utils.Logger.info('Calculating global metrics...');
                            calcuateGlobalMetrics()
                                .then(() => {
                                    services.app.CronJobExecutedService.add(
                                        'calcuateGlobalMetrics'
                                    );
                                    utils.Logger.info(
                                        'calcuateGlobalMetrics successfully executed!'
                                    );
                                })
                                .catch((e) => {
                                    utils.Logger.error(
                                        'calcuateGlobalMetrics FAILED! ' + e
                                    );
                                });
                            utils.Logger.info(
                                'calcuateCommunitiesMetrics successfully executed!'
                            );
                        })
                        .catch((e) => {
                            utils.Logger.error(
                                'calcuateCommunitiesMetrics FAILED! ' + e
                            );
                        });
                })
                .catch((e) => {
                    utils.Logger.error('cleanupNetworkRewards FAILED! ' + e);
                });
        },
        null,
        true
    );

    // eslint-disable-next-line no-new
    new CronJob(
        '0 0 * * *',
        () => {
            services.global.GlobalDemographicsService.calculateDemographics()
                .then(() => {
                    services.app.CronJobExecutedService.add(
                        'calculateDemographics'
                    );
                    utils.Logger.info(
                        'calculateDemographics successfully executed!'
                    );
                })
                .catch((e) => {
                    utils.Logger.error('calculateDemographics FAILED! ' + e);
                });
        },
        null,
        true
    );

    try {
        // eslint-disable-next-line no-new
        new CronJob(
            '0 0 * * *',
            () => {
                services.global.GlobalDemographicsService.calculateCommunitiesDemographics()
                    .then(() => {
                        services.app.CronJobExecutedService.add(
                            'calculateCommunitiesDemographics'
                        );
                        utils.Logger.info(
                            'calculateCommunitiesDemographics successfully executed!'
                        );
                    })
                    .catch((e) => {
                        utils.Logger.error(
                            'calculateCommunitiesDemographics FAILED! ' + e
                        );
                    });
            },
            null,
            true
        );
    } catch (e) {
        /** */
    }

    // everyday at 1am
    // eslint-disable-next-line no-new
    new CronJob(
        '0 1 * * *',
        () => {
            utils.Logger.info('Verify stories...');
            verifyStoriesLifecycle()
                .then(() => {
                    services.app.CronJobExecutedService.add(
                        'verifyStoriesLifecycle'
                    );
                    utils.Logger.info(
                        'verifyStoriesLifecycle successfully executed!'
                    );
                })
                .catch((e) => {
                    utils.Logger.error('verifyStoriesLifecycle FAILED! ' + e);
                });
        },
        null,
        true
    );

    // at 5:12 am.
    // eslint-disable-next-line no-new
    new CronJob(
        '12 5 * * *',
        () => {
            utils.Logger.info('Verify community suspicious activity...');
            verifyCommunitySuspectActivity()
                .then(() => {
                    services.app.CronJobExecutedService.add(
                        'verifyCommunitySuspectActivity'
                    );
                    utils.Logger.info(
                        'verifyCommunitySuspectActivity successfully executed!'
                    );
                })
                .catch((e) => {
                    utils.Logger.error(
                        'verifyCommunitySuspectActivity FAILED! ' + e
                    );
                });
        },
        null,
        true
    );

    // at 2:12 am and 2:12 pm.
    // eslint-disable-next-line no-new
    new CronJob(
        '12 2,14 * * *',
        () => {
            utils.Logger.info('Verify user suspicious activity...');
            verifyUserSuspectActivity()
                .then(() => {
                    services.app.CronJobExecutedService.add(
                        'verifyUserSuspectActivity'
                    );
                    utils.Logger.info(
                        'verifyUserSuspectActivity successfully executed!'
                    );
                })
                .catch((e) => {
                    utils.Logger.error(
                        'verifyUserSuspectActivity FAILED! ' + e
                    );
                });
        },
        null,
        true
    );

    try {
        // everyday at 1am
        // eslint-disable-next-line no-new
        new CronJob(
            '0 1 * * *',
            () => {
                utils.Logger.info('Verify deleted accounts...');
                verifyDeletedAccounts()
                    .then(() => {
                        services.app.CronJobExecutedService.add(
                            'verifyDeletedAccounts'
                        );
                        utils.Logger.info(
                            'verifyDeletedAccounts successfully executed!'
                        );
                    })
                    .catch((e) => {
                        utils.Logger.error(
                            'verifyDeletedAccounts FAILED! ' + e
                        );
                    });
            },
            null,
            true
        );
    } catch (e) {
        /** */
    }
}
