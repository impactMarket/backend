import express from 'express';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export default function swaggerSetup(app: express.Application): void {
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
}
