import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import config from '../config';
import { LoggerStream } from '../loaders/logger';
import routes from '../routes';

export default ({ app }: { app: express.Application }): void => {
    /**
     * Health Check endpoints
     * @TODO Explain why they are here
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

    // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // It shows the real origin IP in the heroku or Cloudwatch logs
    app.enable('trust proxy');

    app.use(morgan('combined', { stream: new LoggerStream() }) as any);

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
    app.use(bodyParser.json());
    // Load API routes
    app.use(config.api.prefix, routes());

    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());

    /// catch 404
    app.use((req, res, next) => {
        res.status(404).send('what???');
    });

    /// error handlers
    app.use((err: any, req: Request, res: Response) => {
        if (err.name === 'UnauthorizedError') {
            res.status(err.status).send({ message: err.message }).end();
        }
        res.status(err.status || 500).json({
            errors: {
                message: err.message,
            },
        });
    });
};
