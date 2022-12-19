import { utils } from '@impactmarket/core';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './config';
import { rateLimiter } from './middlewares';
import v1routes from './routes/v1';
import v2routes from './routes/v2';
import swaggerSetup from './swagger';

export default (app: express.Application): void => {
    /**
     * health check endpoints
     * https://testfully.io/blog/api-health-check-monitoring
     */
    app.get('/status', (_, res) => {
        res.status(200).end();
    });
    app.head('/status', (_, res) => {
        res.status(200).end();
    });

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
    app.use((_, res, next) => {
        // format routes to aggregate reports
        const transaction = (res as any).__sentry_transaction;
        transaction.name = transaction.name
            .replace(
                /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[4][0-9A-Fa-f]{3}-[89AB][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}/g,
                '<uuid>'
            )
            .replace(/0x[a-fA-F0-9]{40}/g, '<address>')
            .replace(/true|false/g, '<boolean>')
            .replace(/\d/g, '<digit>');
        (res as any).__sentry_transaction = transaction;
        next();
    });

    swaggerSetup(app);

    // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // It shows the real origin IP in the heroku or Cloudwatch logs
    app.enable('trust proxy');

    app.use(helmet());

    // The magic package that prevents frontend developers going nuts
    // Alternate description:
    // Enable Cross Origin Resource Sharing to all origins by default
    app.use(cors());
    app.use((_, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept'
        );
        next();
    });

    // Middleware that transforms the raw string of req.body into json
    app.use(express.json());

    // per environment configs
    if (process.env.API_ENVIRONMENT === 'production') {
        // important to have rete limiting in production
        app.use(rateLimiter);
    }
    if (process.env.NODE_ENV === 'development') {
        // redundant in production (heroku logs it already), but useful for development
        app.use(morgan('combined'));
    }

    // Load API routes
    app.use(config.api.prefix, v1routes());
    app.use(config.api.v2prefix, v2routes());

    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());

    // TODO: do we need this?
    app.use((error, req, res, next) => {
        utils.Logger.error(
            req.originalUrl + ' -> ' + error &&
                error.details &&
                error.details.get('body') &&
                error.details.get('body').details &&
                error.details.get('body').details.length > 0 &&
                error.details.get('body').details[0].message
        );
        if (error && error.toString().indexOf('Validation failed') !== -1) {
            return res.status(400).json({
                success: false,
                error: {
                    name: 'INVALID_PAYLOAD',
                    message: 'invalid payloads',
                    details: error.details.get('query')
                        ? error.details.get('query').details
                        : error.details.get('body').details,
                },
            });
        }
        next();
    });

    // when a route does not exist
    app.use((_, res) =>
        res.status(404).send({
            success: false,
            error: 'This route does not exist! Visit the swagger docs at /api-docs',
        })
    );

    /// error handlers
    app.use((err: any, req: Request, res: Response) => {
        if (err.name === 'UnauthorizedError') {
            res.status(err.status)
                .send({ success: false, message: err.message })
                .end();
        }
        res.status(err.status || 500).json({
            success: false,
            errors: {
                message: err.message,
            },
        });
    });
};
