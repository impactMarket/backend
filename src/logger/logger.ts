import winston from 'winston';

import config from '../config';

const transports: (
    | winston.transports.FileTransportInstance
    | winston.transports.ConsoleTransportInstance
)[] = [
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.cli(),
            winston.format.splat()
        ),
    }),
];
// if (NODE_ENV === 'development') {
//     transports.push(
//         new winston.transports.Console({
//             format: winston.format.combine(
//                 winston.format.cli(),
//                 winston.format.splat(),
//             )
//         })
//     )
// }

export const Logger = winston.createLogger({
    level: config.logs.level,
    levels: winston.config.npm.levels,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'DD-MM-YYYY HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    transports,
});
