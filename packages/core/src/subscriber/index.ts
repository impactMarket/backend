import { utils, config } from '../../';
import { ethers } from 'ethers';
import schedule from 'node-schedule';
import WebSocket from 'ws';
import { ubi } from '../services'

import { ChainSubscribers } from './chainSubscribers';
import { Community } from '../database/models/ubi/community';

let subscribers: ChainSubscribers;
let usingFallbackUrl = false;
let waitingForResponseAfterCrash = false;
let successfullAnswersAfterCrash = 0;
let failedAnswers = 0;
let intervalWhenCrash: NodeJS.Timeout | undefined = undefined;
let waitingForResponseAfterTxRegWarn = false;

let provider: ethers.providers.WebSocketProvider;
let jsonRpcProvider: ethers.providers.JsonRpcProvider;
let providerFallback: ethers.providers.WebSocketProvider;
let availableCommunities: Community[];

export const start = async (): Promise<void> => {
    provider = new ethers.providers.WebSocketProvider(config.webSocketUrl);
    jsonRpcProvider = new ethers.providers.WebSocketProvider(config.jsonRpcUrl);
    providerFallback = new ethers.providers.WebSocketProvider(
        config.webSocketUrlFallback
    );
    availableCommunities =
        await ubi.CommunityService.listCommunitiesStructOnly();
    subscribers = startChainSubscriber();

    provider._websocket.on('close', () => {
        utils.Logger.error('WS connection lost! Reconnecting...');
        reconnectChainSubscriber();
    });

    process.on('uncaughtException', (error: any) => {
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
            if (
                providerFallback._websocket.readyState === WebSocket.CLOSED ||
                providerFallback._websocket.readyState === WebSocket.CLOSING
            ) {
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
                    providerFallback = new ethers.providers.WebSocketProvider(config.webSocketUrlFallback);
                }
            } else {
                successfullAnswersAfterCrash += 1;
                // require 5 successfull answers, to prevent two or more crashes in row
                if (successfullAnswersAfterCrash <= 5) {
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
                    schedule.scheduleJob(Date.now() + 60000 * 30, () => {
                        utils.Logger.info(
                            'Conecting with the principal provider'
                        );
                        subscribers.stop();
                        subscribers = startChainSubscriber();
                        usingFallbackUrl = false;
                        failedAnswers = 0;
                        successfullAnswersAfterCrash = 0;
                        provider = new ethers.providers.WebSocketProvider(config.webSocketUrl);
                        reconnectChainSubscriber();
                    });
                }
            };
        } else {
            if (
                provider._websocket.readyState === WebSocket.CLOSED ||
                provider._websocket.readyState === WebSocket.CLOSING
            ) {
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
                    provider = new ethers.providers.WebSocketProvider(config.webSocketUrl);
                }
            } else {
                if (successfullAnswersAfterCrash < 5) {
                    successfullAnswersAfterCrash += 1;
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
            };
        }
    }, 2000);
}

function startChainSubscriber(fallback?: boolean): ChainSubscribers {
    return new ChainSubscribers(
        fallback ? providerFallback : provider,
        jsonRpcProvider,
        new Map(
            availableCommunities.map((c) => [c.contractAddress!, c.id])
        ),
    );
}
