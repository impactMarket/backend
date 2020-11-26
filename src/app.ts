import express from 'express';
import * as Sentry from "@sentry/node";
import { Integrations } from "@sentry/tracing";
import config from './config';
import Logger from './loaders/logger';
import loaders from './loaders';

async function startServer() {
    const app = express();

    Sentry.init({
        dsn: config.sentryKey,
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            new Integrations.Express({ app }),
            new Integrations.BrowserTracing({
                beforeNavigate: context => {
                    return {
                        ...context,
                        // You could use your UI's routing library to find the matching
                        // route template here. We don't have one right now, so do some basic
                        // parameter replacements.
                        name: location.pathname
                            .replace(/\d+/g, "<digits>")
                            .replace(/[a-f0-9]{32}/g, "<hash>"),
                    };
                },
            }),
        ],
        tracesSampleRate: config.sentryKey === undefined ? 1 : 0.1,
    });
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