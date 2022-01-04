import 'module-alias/register';
import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';
import { Logger } from '@utils/logger';
import express from 'express';

import config from '../config';
import { sequelize } from '../database';
import serverLoader from './server';

export async function startServer() {
    const app = express();

    if (process.env.NODE_ENV !== 'test') {
        Sentry.init({
            dsn: config.sentryKey,
            debug: process.env.NODE_ENV === 'development',
            integrations: [
                // enable HTTP calls tracing
                new Sentry.Integrations.Http({ tracing: true }),
                // enable Express.js middleware tracing
                new Integrations.Express({ app }),
            ],
            tracesSampler: (samplingContext) => {
                // Examine provided context data (including parent decision, if any) along
                // with anything in the global namespace to compute the sample rate or
                // sampling decision for this transaction

                // always inherit
                if (samplingContext.parentSampled !== undefined) {
                    return samplingContext.parentSampled;
                }

                if (
                    samplingContext.transactionContext.name.indexOf(
                        '/mobile/error'
                    ) !== -1 ||
                    samplingContext.transactionContext.name.indexOf(
                        '/mobile/version'
                    ) !== -1
                ) {
                    // Ignore this.
                    return 0;
                } else {
                    // Default sample rate
                    return config.tracesSampleRate;
                }
            },
            tracesSampleRate: config.tracesSampleRate,
        });
    }

    if (process.env.NODE_ENV === 'development') {
        Logger.debug('DEBUG');
        Logger.verbose('VERBOSE');
        Logger.info('INFO');
        Logger.warn('WARNING');
        Logger.error('ERROR');
    }

    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'test') {
        await sequelize.sync();
    }
    Logger.info('🗺️  Database loaded and connected');

    await serverLoader(app);
    Logger.info('📡 Express server loaded');

    return app.listen(config.port, () => {
        Logger.info(`
        ################################################
        🛡️  Server listening on port: ${config.port} 🛡️ 
        ################################################
        `);
    });
}

if (process.env.NODE_ENV !== 'test') {
    startServer();
}
