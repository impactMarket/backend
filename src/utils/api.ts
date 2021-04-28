import { Logger } from '@utils/logger';
import { Response } from 'express';

export const controllerLogAndFail = (e: any, status: number, res: Response) => {
    Logger.error(e);
    res.status(status).send(e);
};

export const standardResponse = (
    res: Response,
    status: number,
    success: boolean,
    data: any,
    options?: {
        errorMessage?: string;
        count?: number;
    }
) => {
    res.status(status).send({
        success,
        data,
        errorMessage: options?.errorMessage,
        count: options?.count,
    });
};
