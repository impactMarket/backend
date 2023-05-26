import 'module-alias/register';
import { utils, config, database } from '@impactmarket/core';
import express from 'express';

import serverLoader from './server';
import { startSubscribers } from './loaders/subscriber';
import { checkWalletBalances } from './loaders/checkWalletBalances';
import { checkLearnAndEarnBalances } from './loaders/checkLearnAndEarnBalances';

export async function startServer() {
    const app = express();

    if (process.env.NODE_ENV === 'development') {
        utils.Logger.debug('DEBUG');
        utils.Logger.verbose('VERBOSE');
        utils.Logger.info('INFO');
        utils.Logger.warn('WARNING');
        utils.Logger.error('ERROR');
    }

    await database.sequelize.authenticate();
    if (process.env.NODE_ENV !== 'test') {
        await database.sequelize.sync();
    }
    utils.Logger.info('🗺️ Database loaded and connected');

    serverLoader(app);
    utils.Logger.info('📡 Express server loaded');

    utils.pushNotification.initPushNotificationService();

    // prevent subscribers and validations to run on dev mode
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
        startSubscribers();
        checkWalletBalances().then(() => utils.Logger.info('🕵️ checkWalletBalances finished')).catch((err) => utils.Logger.error('checkWalletBalances' + err));
        checkLearnAndEarnBalances().then(() => utils.Logger.info('🕵️ checkLearnAndEarnBalances finished')).catch((err) => utils.Logger.error('checkLearnAndEarnBalances' + err));
    }

    return app.listen(config.port, () => {
        utils.Logger.info(`
        ################################################
        🛡️  Server listening on port: ${config.port} 🛡️ 
        ################################################
        `);
    });
}

if (process.env.NODE_ENV !== 'test') {
    startServer();
}
