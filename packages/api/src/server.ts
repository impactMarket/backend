import { utils } from '@impactmarket/core';
import * as Sentry from '@sentry/node';
// import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan, { compile } from 'morgan';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import config from './config';
import { rateLimiter } from './middlewares';
import v1routes from './routes/v1';
import v2routes from './routes/v2';

export default (app: express.Application): void => {
    /**
     * health check endpoints
     * https://testfully.io/blog/api-health-check-monitoring
     */
    app.get('/status', (req, res) => {
        res.status(200).end();
    });
    app.head('/status', (req, res) => {
        res.status(200).end();
    });

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
    app.use((req, res, next) => {
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

    let swaggerServers: {
        url: string;
    }[] = [];
    let urlSchema = 'http';
    if (process.env.NODE_ENV === 'development') {
        swaggerServers = [
            {
                url: 'http://localhost:5000/api/v2',
            },
        ];
    } else {
        swaggerServers = [
            {
                url: `https://impactmarket-api-${process.env.API_ENVIRONMENT}.herokuapp.com/api/v2`,
            },
        ];
        urlSchema = 'https';
    }
    if (swaggerServers.length > 0 && process.env.NODE_ENV !== 'test') {
        const options = {
            swaggerDefinition: {
                openapi: '3.0.1',
                info: {
                    description: 'Swagger UI for impactMarket API',
                    version: '1.0.0',
                    title: 'impactMarket',
                    license: {
                        name: 'Apache 2.0',
                        url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
                    },
                },
                tags: [
                    {
                        name: 'users',
                        description: 'Everything about your users',
                    },
                    {
                        name: 'stories',
                        description: 'Manage stories',
                    },
                    {
                        name: 'communities',
                        description: 'UBI communities',
                    },
                ],
                servers: swaggerServers,
                schemes: [urlSchema],
                components: {
                    securitySchemes: {
                        api_auth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                            scopes: {
                                write: 'modify',
                                read: 'read',
                            },
                        },
                    },
                },
            },
            apis: [
                path.join(__dirname, '../src/routes/v2/**/*.ts'),
                path.join(__dirname, '../../core/src/services/**/*.ts'),
                path.join(__dirname, '../../core/src/interfaces/ubi/*.ts'),
                path.join(__dirname, '../../core/src/interfaces/app/*.ts'),
                path.join(__dirname, '../../core/src/interfaces/story/*.ts'),
            ],
        };
        const swaggerSpec = swaggerJsdoc(options);

        console.log(swaggerSpec);

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // It shows the real origin IP in the heroku or Cloudwatch logs
    app.enable('trust proxy');

    app.use(helmet());
    // The magic package that prevents frontend developers going nuts
    // Alternate description:
    // Enable Cross Origin Resource Sharing to all origins by default
    app.use(cors());
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept'
        );
        next();
    });

    // Middleware that transforms the raw string of req.body into json
    app.use(express.json());
    // app.use(express.urlencoded({ extended: true }));

    // per environment configs
    if (process.env.API_ENVIRONMENT === 'production') {
        // important to have rate limiting in production
        app.use(rateLimiter);
    }

    if (process.env.NODE_ENV === 'development') {
        // redundant in production (heroku logs it already), but useful for development
        app.use(
            morgan((tokens: morgan.TokenIndexer<any>, req, res) => {
                const fn = compile(
                    '\n\x1b[42m:method\x1b[0m :url \x1b[32m:status\x1b[0m :response-time ms'
                );
                return fn(tokens, req, res);
            })
        );
    }

    // Load API routes
    // app.use(config.api.prefix, v1routes());
    app.use(config.api.v2prefix, v2routes());

    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());

    // TODO: is this needed?
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
            error: 'This route does not exist! Please, visit the swagger docs at /api-docs',
        })
    );

    // TODO: is this needed?
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
