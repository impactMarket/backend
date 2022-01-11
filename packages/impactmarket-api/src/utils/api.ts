import { utils } from 'impactmarket-core';
import { Response } from 'express';

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
    res.status(status).send({
        success,
        data,
        error: options?.error,
        count: options?.count,
    });
};
