import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan, { compile } from 'morgan';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { rateLimiter } from './middlewares';
import config from './config';
import v1routes from './routes/v1';
import v2routes from './routes/v2';

export default (app: express.Application): void => {
    let swaggerServers: {
        url: string;
    }[] = [];
    let urlSchema = 'http';
    if (process.env.NODE_ENV === 'development') {
        swaggerServers = [
            {
                url: `http://localhost:${process.env.PORT}/api/v2`
            }
        ];
    } else {
        swaggerServers = [
            {
                url: `https://impactmarket-api-${process.env.API_ENVIRONMENT}.herokuapp.com/api/v2`
            }
        ];
        urlSchema = 'https';
    }
    if (swaggerServers.length > 0 && process.env.NODE_ENV !== 'test') {
        const options = {
            swaggerDefinition: {
                openapi: '3.0.1',
                info: {
                    description:
                        'Swagger UI for impactMarket API. To generate signatures use https://etherscan.io/verifiedSignatures',
                    version: '1.0.0',
                    title: 'impactMarket',
                    license: {
                        name: 'Apache 2.0',
                        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
                    }
                },
                tags: [
                    {
                        name: 'users',
                        description: 'Everything about your users'
                    },
                    {
                        name: 'stories',
                        description: 'Manage stories'
                    },
                    {
                        name: 'communities',
                        description: 'UBI communities'
                    },
                    {
                        name: 'microcredit',
                        description:
                            'MicroCredit endpoints. In this section, all endpoints are protected by authentication and signature verification. Be sure to be properly authenticated!'
                    },
                    {
                        name: 'learn-and-earn',
                        description: 'Learn and Earn'
                    },
                    {
                        name: 'referrals',
                        description: 'impactMarket referral program!'
                    }
                ],
                servers: swaggerServers,
                schemes: [urlSchema],
                components: {
                    securitySchemes: {
                        BearerToken: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT'
                        },
                        Signature: {
                            type: 'apiKey',
                            in: 'header',
                            name: 'signature'
                        },
                        SignatureMessage: {
                            type: 'apiKey',
                            in: 'header',
                            name: 'message'
                        },
                        SignatureEIP712Signature: {
                            type: 'apiKey',
                            in: 'header',
                            name: 'eip712Signature'
                        },
                        SignatureEIP712Value: {
                            type: 'apiKey',
                            in: 'header',
                            name: 'eip712Value'
                        }
                    }
                }
            },
            apis: [
                path.join(__dirname, '../src/routes/v2/**/*.ts'),
                path.join(__dirname, '../../core/src/services/**/*.ts'),
                path.join(__dirname, '../../core/src/interfaces/ubi/*.ts'),
                path.join(__dirname, '../../core/src/interfaces/app/*.ts'),
                path.join(__dirname, '../../core/src/interfaces/story/*.ts')
            ]
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
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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

    if (process.env.NODE_ENV === 'development' || process.env.RUN_LOCAL_BUILD) {
        // status monitor . Use http://localhost:port/status to see it
        app.use(require('express-status-monitor')());
        // redundant in production (heroku logs it already), but useful for development
        app.use(
            morgan((tokens: morgan.TokenIndexer<any>, req, res) => {
                const fn = compile('\n\x1b[42m:method\x1b[0m :url \x1b[32m:status\x1b[0m :response-time ms');
                return fn(tokens, req, res);
            })
        );
    }

    // Load API routes
    // currenclty only PACT supply endpoints (used by external services)
    app.use(config.api.prefix, v1routes());
    // default
    app.use(config.api.v2prefix, v2routes());

    // error handling - Joi validation
    app.use((error, req, res, next) => {
        if (error && error.toString().indexOf('Validation failed') !== -1) {
            return res.status(400).json({
                success: false,
                error: {
                    name: 'INVALID_PAYLOAD',
                    message: 'invalid payloads',
                    details: error.details.get('query')
                        ? error.details.get('query').details
                        : error.details.get('body').details
                }
            });
        }
        next();
    });

    // when a route does not exist
    app.use((_, res) =>
        res.status(404).send({
            success: false,
            error: 'This route does not exist! Please, visit the swagger docs at /api-docs'
        })
    );
};
