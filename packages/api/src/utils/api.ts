import { utils } from '@impactmarket/core';
import { Response } from 'express';

export const cacheIntervals = {
    fiveMinutes: 300,
    tenMinutes: 600,
    halfHour: 1800,
    oneHour: 3600,
    twelveHours: 43200,
    oneDay: 86400,
};

export const controllerLogAndFail = (e: any, status: number, res: Response) => {
    utils.Logger.error(e);
    res.status(status).send(e);
};

export const standardResponse = (
    res: Response,
    status: number,
    success: boolean,
    data: any,
    options?: {
        error?: {
            name: string;
            message: string;
        };
        count?: number;
    }
) => {
    if (options?.error && process.env.NODE_ENV === 'development') {
        console.error(options.error);
    }
    res.status(status).send({
        success,
        data,
        error: options?.error,
        count: options?.count,
    });
};
