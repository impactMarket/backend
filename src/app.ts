import express from 'express';
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import config from './config';
import Logger from './loaders/logger';
import loaders from './loaders';

async function startServer() {
    const app = express();

    if (process.env.NODE_ENV !== 'development') {
        Sentry.init({
            dsn: process.env.SENTRY_KEY,
            integrations: [
                // enable HTTP calls tracing
                new Sentry.Integrations.Http({ tracing: true }),
                // enable Express.js middleware tracing
                new Tracing.Integrations.Express({ app }),
            ],
            tracesSampleRate: 1.0,
        });
    }
    await loaders({ expressApp: app });

    app.listen(config.port, () => {
        Logger.info(`
        ################################################
        🛡️  Server listening on port: ${config.port} 🛡️ 
        ################################################
        `);
    });
}

startServer();