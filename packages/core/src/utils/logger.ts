import winston, { format } from 'winston';

import config from '../config';

export const Logger = winston.createLogger({
    level: config.logs.level,
    transports: [
        new winston.transports.Console({
            format: format.combine(format.cli(), format.splat()),
            silent: process.env.NODE_ENV === 'test' // If we're in test mode, we don't want to log to the console
        })
    ]
});
