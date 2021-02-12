import 'module-alias/register';
import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';
import { Logger } from '@utils/logger';
import express from 'express';

import config from '../config';
import { sequelize } from '../database';
import serverLoader from './server';

async function startServer() {
    const app = express();

    Sentry.init({
        dsn: config.sentryKey,
        debug: process.env.NODE_ENV === 'development',
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            new Integrations.Express({ app }),
            new Integrations.BrowserTracing({
                beforeNavigate: (context) => {
                    return {
                        ...context,
                        // You could use your UI's routing library to find the matching
                        // route template here. We don't have one right now, so do some basic
                        // parameter replacements.
                        name: location.pathname
                            .replace(
                                /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[4][0-9A-Fa-f]{3}-[89AB][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}/g,
                                '<uuid>'
                            )
                            .replace(/0x[a-fA-F0-9]{40}/g, '<address>'),
                    };
                },
            }),
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

    if (process.env.NODE_ENV === 'development') {
        Logger.debug('DEBUG');
        Logger.verbose('VERBOSE');
        Logger.info('INFO');
        Logger.warn('WARNING');
        Logger.error('ERROR');
    }

    await sequelize.authenticate();
    await sequelize.sync();
    Logger.info('🗺️  Database loaded and connected');

    await serverLoader(app);
    Logger.info('📡 Express server loaded');

    app.listen(config.port, () => {
        Logger.info(`
        ################################################
        🛡️  Server listening on port: ${config.port} 🛡️ 
        ################################################
        `);
    });
}

startServer();
