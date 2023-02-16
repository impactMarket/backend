import { utils, config } from '@impactmarket/core';
import { ethers } from 'ethers';
import schedule from 'node-schedule';

import { ChainSubscribers } from './chainSubscribers';

const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
const providerFallback = new ethers.providers.JsonRpcProvider(
    config.jsonRpcUrlFallback
);

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
    return new ChainSubscribers(fallback ? providerFallback : provider);
}
