import { services, utils, config } from '@impactmarket/core';
import { CronJob } from 'cron';

import { internalNotifyNewCommunities } from './jobs/cron/community';
import { updateExchangeRates } from './jobs/cron/updateExchangeRates';
import { verifyDeletedAccounts } from './jobs/cron/user';

export default async (): Promise<void> => {
    cron();
};

/**
 * This method starts all cron jobs. Cron jobs jave specific times to happen.
 * They all follow the API timezone, which should be UTC, same as postgresql.
 */
function cron() {
    const globalDemographicsService =
        new services.global.GlobalDemographicsService();
    const communityDemographicsService =
        new services.ubi.CommunityDemographicsService();

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

    try {
        // eslint-disable-next-line no-new
        new CronJob(
            '0 0 * * *',
            () => {
                communityDemographicsService
                    .calculate()
                    .then(() => {
                        services.app.CronJobExecutedService.add(
                            'calculateCommunitiesDemographics'
                        );
                        utils.Logger.info(
                            'calculateCommunitiesDemographics successfully executed!'
                        );

                        globalDemographicsService
                            .calculate()
                            .then(() => {
                                services.app.CronJobExecutedService.add(
                                    'calculateDemographics'
                                );
                                utils.Logger.info(
                                    'calculateDemographics successfully executed!'
                                );
                            })
                            .catch((e) => {
                                utils.Logger.error(
                                    'calculateDemographics FAILED! ' + e
                                );
                            });
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
